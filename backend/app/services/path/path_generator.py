from typing import Dict, List, Optional

# INTERVIEW: import matcher here (not LLM) — keeps path deterministic and explainable
try:
    from app.services.resources.resource_matcher import recommend_resources
except ImportError:
    recommend_resources = None  # type: ignore

from app.services.prerequisites import (
    build_prerequisite_map,
    order_by_dependencies,
    prerequisite_depths,
    unresolved_prerequisites,
)

IMPORTANCE_WEIGHT = {
    "critical": 1.0,
    "high": 0.85,
    "medium": 0.65,
    "low": 0.40
}


def calculate_skill_gaps(
    current_skills: Dict[str, float],
    career_requirements: List[dict]
) -> List[dict]:
    gaps = []

    for requirement in career_requirements:
        skill_id = requirement["skill_id"]
        required_mastery = requirement["required_mastery"]
        importance = requirement.get("importance", "medium")

        current_mastery = current_skills.get(skill_id, 0)

        gap = max(required_mastery - current_mastery, 0)

        if gap > 0:
            importance_weight = IMPORTANCE_WEIGHT.get(
                importance,
                IMPORTANCE_WEIGHT["medium"]
            )

            priority_score = gap * importance_weight

            gaps.append({
                "skill_id": skill_id,
                "current_mastery": current_mastery,
                "required_mastery": required_mastery,
                "gap": gap,
                "importance": importance,
                "priority_score": round(priority_score, 2)
            })

    gaps.sort(
        key=lambda item: item["priority_score"],
        reverse=True
    )

    return gaps


def generate_learning_path(
    recommendations: List[dict],
    prerequisites: Optional[List[dict]] = None,
    resources: Optional[List[dict]] = None,
    learner_level: str = "beginner",
    learning_preference: Optional[str] = None,
    max_hours: Optional[float] = None,
    resource_limit: int = 3,
    current_skills: Optional[Dict[str, float]] = None,
    career_requirements: Optional[List[dict]] = None,
) -> dict:
    """
    Generate a personalized learning path from skill recommendations.

    This function takes skill recommendations (from the recommendation engine)
    and creates a sequential learning path that respects prerequisite
    dependencies, ensuring learners build knowledge in the correct order.

    Readiness is mastery-aware: a skill is "blocked" when any prerequisite
    is below its required mastery, even if the skill itself has no gap left.
    Steps are emitted in deterministic topological order (prerequisites
    first, priority order preserved inside each dependency layer), and
    already-mastered prerequisites never appear as learning steps — the gap
    engine already drops gap-0 skills from the recommendations.

    Args:
        recommendations: List of skill recommendations from recommend_skills
        prerequisites: Canonical prerequisite edges
            ({skill_id, prerequisite_skill_id, type}); normalized by the
            data loader, consumed here with no key fallbacks
        resources: Curated resources list (from load_resources) — matched per skill
        learner_level: beginner|intermediate|advanced for difficulty fit
        learning_preference: project|theory|mixed for type fit
        max_hours: time fit filter for resources
        resource_limit: top-N resources per skill
        current_skills: Optional mastery map, used to judge prerequisites
            that are not themselves recommended steps (e.g. mastered or
            out-of-career foundations)
        career_requirements: Optional [{skill_id, required_mastery, ...}],
            used as the mastery bar for prerequisites outside the
            recommendations

    Returns:
        Dictionary containing the personalized learning path with stages/phases

    Raises:
        PrerequisiteCycleError: when the recommended skills contain a
            dependency cycle — no fake ordered path is returned.
    """
    # INTERVIEW: canonical map only — Phase 10R.1 removed the
    # target_skill/source_skill fallback that silently produced {"": [""]}
    # and made every skill look unblocked.
    prereq_map = build_prerequisite_map(prerequisites)

    mastery: Dict[str, float] = dict(current_skills or {})
    required: Dict[str, float] = {}
    if career_requirements:
        for row in career_requirements:
            if isinstance(row, dict) and row.get("skill_id"):
                try:
                    required[str(row["skill_id"])] = float(row.get("required_mastery", 0))
                except (TypeError, ValueError):
                    continue
    for recommendation in recommendations:
        skill_id = recommendation.get("skill_id", recommendation.get("skill", ""))
        if not skill_id:
            continue
        mastery[str(skill_id)] = recommendation.get("current_mastery", mastery.get(skill_id, 0))
        if skill_id not in required:
            try:
                required[str(skill_id)] = float(recommendation.get("required_mastery", 0))
            except (TypeError, ValueError):
                pass

    # Process recommendations in priority order (support priority_score legacy)
    ordered_recommendations = sorted(
        [r for r in recommendations if r.get("skill_id", r.get("skill", ""))],
        key=lambda x: x.get("priority", x.get("priority_score", 0)),
        reverse=True
    )

    # INTERVIEW: deterministic topological order — a dependent skill can never
    # be emitted before a prerequisite step. Raises on cycles (explicit error,
    # never a silently invalid path). No LLM decides ordering.
    step_ids = [str(r.get("skill_id", r.get("skill", ""))) for r in ordered_recommendations]
    step_order = order_by_dependencies(step_ids, prereq_map)
    depths = prerequisite_depths(step_order, prereq_map)
    rec_by_id = {str(r.get("skill_id", r.get("skill", ""))): r for r in ordered_recommendations}

    # Build the learning path in dependency order
    path = []

    for skill_id in step_order:
        recommendation = rec_by_id[skill_id]
        priority = recommendation.get("priority", recommendation.get("priority_score", 0))

        # INTERVIEW: match resources per skill here — deterministic 50/20/20/10, no LLM
        skill_resources: List[dict] = []
        if resources and recommend_resources is not None:
            try:
                skill_resources = recommend_resources(
                    skill_id=skill_id,
                    resources=resources,
                    learner_level=learner_level,
                    learning_preference=learning_preference,
                    max_hours=max_hours,
                    limit=resource_limit,
                )
            except Exception:
                skill_resources = []

        # Resolve prerequisites against real mastery — a skill with no gap
        # of its own is still blocked while its chain is unsatisfied.
        unresolved = _get_unresolved_prerequisites(
            skill_id, mastery, required, prereq_map
        )

        if unresolved:
            # Skill is blocked by prerequisites - add prerequisite info
            path.append({
                "skill": skill_id,
                "skill_id": skill_id,
                "status": "blocked",
                "prerequisites": unresolved,
                "current_mastery": recommendation.get("current_mastery", 0),
                "required_mastery": recommendation.get("required_mastery", 0),
                "gap": recommendation.get("gap", 0),
                "priority": priority,
                "prerequisite_depth": depths.get(skill_id, 0),
                "resources": skill_resources,
            })
        else:
            # Skill can be learned - add to path
            path.append({
                "skill": skill_id,
                "skill_id": skill_id,
                "status": "ready",
                "current_mastery": recommendation.get("current_mastery", 0),
                "required_mastery": recommendation.get("required_mastery", 0),
                "gap": recommendation.get("gap", 0),
                "priority": priority,
                "prerequisite_depth": depths.get(skill_id, 0),
                "resources": skill_resources,
            })

    # Organize into phases based on dependency levels
    phases = _organize_into_phases(path)

    return {
        "learning_path": path,
        "phases": phases,
        "total_skills": len(path),
        "ready_skills": sum(1 for step in path if step.get("status") == "ready"),
        "blocked_skills": sum(1 for step in path if step.get("status") == "blocked")
    }


def _get_unresolved_prerequisites(
    skill_id: str,
    mastery: Dict[str, float],
    required: Dict[str, float],
    prereq_map: Dict[str, List[str]]
) -> List[str]:
    """Prerequisites of ``skill_id`` not yet mastered to the required bar.

    A prerequisite counts as satisfied only when its current mastery meets
    its required mastery (unknown mastery counts as 0). Sorted, deterministic.
    """
    return unresolved_prerequisites(skill_id, mastery, required, prereq_map)


def _organize_into_phases(path: List[dict]) -> List[Dict[str, object]]:
    """Group learning-path steps into phases by dependency depth.

    Each phase is one dependency layer: every prerequisite step sits in an
    earlier phase than its dependents. Steps inside a phase keep path order
    (priority within the layer). Empty layers are omitted, so phase numbers
    stay compact even when mastered foundations collapse the lower layers.
    """
    by_depth: Dict[int, List[dict]] = {}
    for step in path:
        try:
            depth = int(step.get("prerequisite_depth", 0))
        except (TypeError, ValueError):
            depth = 0
        by_depth.setdefault(depth, []).append(step)

    phases = []
    for number, depth in enumerate(sorted(by_depth), start=1):
        phases.append({
            "phase": number,
            "skills": [
                {
                    "skill": step.get("skill", ""),
                    "priority": step.get("priority", 0),
                    "prerequisite_depth": depth,
                }
                for step in by_depth[depth]
            ],
            "description": (
                f"Phase {number}: Foundational skills"
                if depth == 0
                else f"Phase {number}: Builds on earlier phases"
            ),
        })

    return phases
