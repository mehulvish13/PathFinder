from typing import List, Optional
import math


def generate_roadmap(
    learning_path: List[dict],
    target_career: str,
    hours_per_week: Optional[float] = None,
    prerequisites: Optional[List[dict]] = None,
) -> dict:
    """
    Generate a roadmap from the learning path.

    Transforms the learning path into structured phases with milestones,
    estimated hours, and next action recommendations.

    Phases are dependency layers, not fixed-size chunks: every prerequisite
    step sits in an earlier phase than its dependents. Depth comes from each
    step's ``prerequisite_depth`` (attached by the path generator), or is
    derived from ``prerequisites`` when steps carry none. With no dependency
    information at all, skills form a single honest phase rather than fake
    layers. Phase/response fields are unchanged so existing clients keep
    working.

    Args:
        learning_path: List of skill steps from the learning path generator
        target_career: Target career for the roadmap (e.g., "GenAI Engineer")
        hours_per_week: Optional hours per week for time estimation
        prerequisites: Optional canonical prerequisite edges, used only to
            derive depths when steps do not already carry ``prerequisite_depth``

    Returns:
        Dictionary containing the structured roadmap
    """
    # INTERVIEW: dependency layers replace V1 fixed 3-skills-per-phase
    # chunking — phase structure now reflects the prerequisite graph
    # (Phase 10R.1). No LLM decides phase structure.
    depths = _resolve_step_depths(learning_path, prerequisites)

    layers: dict = {}
    for item, depth in zip(learning_path, depths):
        layers.setdefault(depth, []).append(item)

    phases = []
    for phase_number, depth in enumerate(sorted(layers), start=1):
        phases.append(
            build_phase(
                layers[depth],
                phase_number,
                depth=depth,
            )
        )

    # Calculate total estimated hours
    total_hours = sum(
        phase["estimated_hours"]
        for phase in phases
    )

    # Determine next action
    next_action = get_next_action(phases)

    # INTERVIEW: hours_per_week turns total hours into calendar time (V1 estimate); None/guarded when pace unknown so schema stays honest.
    estimated_weeks = None
    try:
        pace = float(hours_per_week) if hours_per_week else 0
        if pace > 0:
            estimated_weeks = round(total_hours / pace, 1)
    except (TypeError, ValueError):
        estimated_weeks = None

    return {
        "title": f"{target_career} Learning Roadmap",
        "target_career": target_career,
        "total_estimated_hours": total_hours,
        "estimated_weeks": estimated_weeks,
        "phases": phases,
        "next_action": next_action,
    }


def _resolve_step_depths(
    learning_path: List[dict],
    prerequisites: Optional[List[dict]] = None,
) -> List[int]:
    """Prerequisite depth per learning-path step, in step order.

    Prefers the ``prerequisite_depth`` the path generator already attached;
    otherwise derives depths from ``prerequisites`` restricted to the steps
    at hand     (satisfied/external foundations count as depth 0). Falls back to
    0 for every step when no dependency information exists.
    """
    provided = [
        step.get("prerequisite_depth")
        for step in learning_path
        if isinstance(step, dict)
    ]
    if provided and all(isinstance(d, (int, float)) for d in provided):
        return [int(d) for d in provided]

    if prerequisites:
        from app.services.prerequisites import (
            build_prerequisite_map,
            prerequisite_depths,
        )

        prereq_map = build_prerequisite_map(prerequisites)
        step_ids = [
            str(step.get("skill_id", step.get("skill", "")))
            for step in learning_path
            if isinstance(step, dict)
        ]
        try:
            computed = prerequisite_depths(step_ids, prereq_map)
            return [computed.get(sid, 0) for sid in step_ids]
        except Exception:
            pass
    return [0 for _ in learning_path]


def build_phase(
    skills: List[dict],
    phase_number: int,
    depth: int = 0,
) -> dict:
    """
    Build a phase from a list of skills.

    Args:
        skills: List of skill dictionaries from learning path
        phase_number: Phase number for identification
        depth: Prerequisite depth of this dependency layer (0 = foundations)

    Returns:
        Dictionary representing a roadmap phase
    """
    estimated_hours = 0
    
    # Calculate estimated hours from resources
    for skill in skills:
        # Extract resources from skill data (handle different formats)
        resources = []
        if "resources" in skill:
            resources = skill["resources"]
        elif "resource_list" in skill:
            resources = skill["resource_list"]
            
        for resource in resources:
            # Handle different resource formats
            if isinstance(resource, dict):
                estimated_hours += resource.get("estimated_hours", 0)
            elif isinstance(resource, str):
                # Default estimate for string resources
                estimated_hours += 2.0  # 2 hours default

    # Extract skill IDs for milestone
    skill_ids = [
        skill["skill_id"] if "skill_id" in skill else skill.get("skill", "")
        for skill in skills
    ]
    
    # Filter out empty skill IDs
    skill_ids = [sid for sid in skill_ids if sid]

    blocked = sum(1 for skill in skills if isinstance(skill, dict) and skill.get("status") == "blocked")
    if depth <= 0:
        layer_text = "Foundations — skills with no open prerequisites. Start here."
    else:
        layer_text = "Builds on earlier phases — unlocks as prerequisite skills progress."
    if blocked:
        layer_text += " Contains blocked skills: resolve their prerequisites first."

    return {
        "id": f"phase_{phase_number}",
        "title": f"Phase {phase_number}",
        "description": layer_text,
        "skills": skills,  # Keep original skill data
        "milestone": {
            "id": f"milestone_{phase_number}",
            "title": (
                f"Complete Phase {phase_number}"
            ),
            "description": (
                "Complete the recommended "
                "learning activities and projects."
            ),
            "skills": skill_ids,
        },
        "estimated_hours": estimated_hours,
    }


def get_next_action(phases: List[dict]) -> str:
    """
    Determine the next action based on the roadmap phases.
    
    Args:
        phases: List of roadmap phase dictionaries
        
    Returns:
        String describing the next action for the learner
    """
    if not phases:
        return "No learning path available yet."

    first_phase = phases[0]

    if not first_phase["skills"]:
        return "No next action available."

    first_skill = first_phase["skills"][0]
    
    # Extract skill ID from different possible formats
    skill_id = (
        first_skill.get("skill_id") or 
        first_skill.get("skill") or 
        "the first skill"
    )

    return (
        f"Start learning {skill_id}."
    )