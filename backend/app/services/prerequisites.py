"""Canonical prerequisite-graph helpers (Phase 10R.1).

Single home for prerequisite semantics. Every consumer (recommendation,
path, roadmap, AI context) builds on these helpers so there is exactly ONE
canonical representation inside the application:

    {"skill_id": <target>, "prerequisite_skill_id": <must-know-first>}

Meaning: ``prerequisite_skill_id`` must be mastered before ``skill_id``.
Example: {"skill_id": "rag", "prerequisite_skill_id": "embeddings"}
means ``embeddings -> rag``.

Raw JSON -> ``data_loader.load_prerequisites`` (normalization) ->
canonical objects -> this module -> deterministic backend logic.
The LLM never decides prerequisites, ordering, readiness, or depth.
"""
from __future__ import annotations

from typing import Dict, List, Optional

# INTERVIEW: fallback only for prerequisite skills outside the learner's
# career requirements (no career row to read a threshold from). Any unknown
# mastery (absent from the mastery map) counts as 0, so an unlearned
# prerequisite blocks regardless of this value; it only matters for partial
# mastery of out-of-career prerequisites.
DEFAULT_REQUIRED_MASTERY = 70.0


class PrerequisiteCycleError(ValueError):
    """Raised when prerequisite edges contain a dependency cycle.

    A cycle (A -> B -> ... -> A) has no valid learning order, so the
    generator refuses to emit an apparently-valid ordered path and says so
    explicitly instead of silently returning a fake roadmap.
    """


def build_prerequisite_map(prerequisites: Optional[List[dict]]) -> Dict[str, List[str]]:
    """Build ``{target_skill: [prerequisite_skill, ...]}`` from canonical edges.

    Reads ONLY the canonical ``skill_id`` / ``prerequisite_skill_id`` keys.
    Malformed rows (missing/blank ids) are skipped — they must never become
    ``{"": [""]}`` entries. Lists are sorted and deduplicated so every
    downstream consumer sees a deterministic map.
    """
    prereq_map: Dict[str, List[str]] = {}
    if not prerequisites:
        return prereq_map
    for edge in prerequisites:
        if not isinstance(edge, dict):
            continue
        target = edge.get("skill_id")
        source = edge.get("prerequisite_skill_id")
        if not target or not source:
            continue
        target, source = str(target).strip(), str(source).strip()
        if not target or not source:
            continue
        prereq_map.setdefault(target, [])
        if source not in prereq_map[target]:
            prereq_map[target].append(source)
    for target in prereq_map:
        prereq_map[target].sort()
    return prereq_map


def unresolved_prerequisites(
    skill_id: str,
    mastery: Dict[str, float],
    required: Dict[str, float],
    prereq_map: Dict[str, List[str]],
    default_required: float = DEFAULT_REQUIRED_MASTERY,
) -> List[str]:
    """Prerequisites of ``skill_id`` whose mastery is below the required bar.

    Example: rag needs [embeddings=80, llm_fundamentals=30] with a required
    mastery of 70 -> returns ["llm_fundamentals"]. Both below -> both
    returned. Both satisfied -> [] (target has no unresolved prerequisites).

    ``mastery`` maps skill -> current mastery (unknown skills count as 0).
    ``required`` maps skill -> required mastery (unknown skills fall back to
    ``default_required``). Sorted for determinism.
    """
    unresolved: List[str] = []
    for prereq in prereq_map.get(skill_id, []):
        current = mastery.get(prereq, 0.0)
        try:
            current = float(current)
        except (TypeError, ValueError):
            current = 0.0
        threshold = required.get(prereq, default_required)
        try:
            threshold = float(threshold)
        except (TypeError, ValueError):
            threshold = default_required
        if current < threshold:
            unresolved.append(prereq)
    return sorted(unresolved)


def find_prerequisite_cycle(prereq_map: Dict[str, List[str]]) -> Optional[List[str]]:
    """Detect a dependency cycle; return the cycle path or None.

    Deterministic: nodes and edges are visited in sorted order. Detects
    self-loops (A -> A) as well as longer cycles (A -> B -> C -> A).
    """
    visiting: Dict[str, int] = {}  # 1 = on current stack, 2 = done
    stack: List[str] = []

    def visit(node: str) -> Optional[List[str]]:
        visiting[node] = 1
        stack.append(node)
        for dep in sorted(prereq_map.get(node, [])):
            state = visiting.get(dep, 0)
            if state == 1:
                return stack[stack.index(dep):] + [dep]
            if state == 0:
                found = visit(dep)
                if found is not None:
                    return found
        stack.pop()
        visiting[node] = 2
        return None

    for node in sorted(prereq_map):
        if visiting.get(node, 0) == 0:
            found = visit(node)
            if found is not None:
                return found
    return None


def prerequisite_depths(
    skill_ids: List[str],
    prereq_map: Dict[str, List[str]],
) -> Dict[str, int]:
    """Longest-chain depth per skill, restricted to the ``skill_ids`` subgraph.

    Prerequisites outside ``skill_ids`` (already mastered, or not part of
    this path) count as satisfied foundations with depth contribution 0, so a
    skill is never pushed into a deep layer just because its already-known
    foundations sit deep in the global graph.

    Raises PrerequisiteCycleError when the induced subgraph has a cycle.
    """
    steps = list(skill_ids)
    step_set = set(steps)
    induced = {
        s: sorted(p for p in prereq_map.get(s, []) if p in step_set)
        for s in steps
    }
    cycle = find_prerequisite_cycle(induced)
    if cycle is not None:
        raise PrerequisiteCycleError(
            "Prerequisite cycle detected: " + " -> ".join(cycle)
        )
    depths: Dict[str, int] = {}

    def depth(node: str) -> int:
        if node in depths:
            return depths[node]
        deps = induced.get(node, [])
        depths[node] = 0 if not deps else 1 + max(depth(d) for d in deps)
        return depths[node]

    for s in steps:
        depth(s)
    return depths


def order_by_dependencies(
    skill_ids: List[str],
    prereq_map: Dict[str, List[str]],
) -> List[str]:
    """Deterministic topological order (Kahn layers, stable within a layer).

    Every prerequisite that is itself in ``skill_ids`` is placed before its
    dependent skill. Skills within the same dependency layer keep their input
    (priority) order. Raises PrerequisiteCycleError on cycles instead of
    emitting a fake order.
    """
    remaining = list(skill_ids)
    step_set = set(remaining)
    ordered: List[str] = []
    placed = set()
    while remaining:
        layer = [
            s for s in remaining
            if all(p in placed or p not in step_set for p in prereq_map.get(s, []))
        ]
        if not layer:
            cycle = find_prerequisite_cycle(
                {s: [p for p in prereq_map.get(s, []) if p in step_set] for s in remaining}
            )
            raise PrerequisiteCycleError(
                "Prerequisite cycle detected: " + " -> ".join(cycle or remaining)
            )
        ordered.extend(layer)
        placed.update(layer)
        remaining = [s for s in remaining if s not in placed]
    return ordered
