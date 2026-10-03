from typing import Dict, List, Optional

from app.services.prerequisites import build_prerequisite_map, unresolved_prerequisites


def recommend_skills(
    skill_gaps: List[dict],
    prerequisites: Optional[List[dict]],
    current_skills: Dict[str, float]
) -> List[dict]:
    """
    Recommend skills based on gaps and prerequisites.

    This function takes the calculated skill gaps, prerequisite information,
    and current skill levels to provide personalized skill recommendations.

    Each recommendation carries truthful prerequisite metadata:
      - prerequisites: every skill that must be known first (canonical edges)
      - blocked_by: prerequisites whose mastery is still below the bar
      - readiness: "ready" when nothing blocks the skill, "blocked" otherwise

    A skill with gap 0 for itself can still be "blocked" when its
    prerequisite chain is unsatisfied — "no gap" is not "ready".

    Args:
        skill_gaps: List of skill gaps calculated by calculate_skill_gaps
        prerequisites: List of prerequisite relationships (canonical
            {skill_id, prerequisite_skill_id, type} shape)
        current_skills: Dictionary of current skill mastery levels

    Returns:
        List of recommended skills with priority and prerequisite info
    """
    # INTERVIEW: one canonical map — the loader normalizes keys, services
    # never branch on target_skill/source_skill variants (Phase 10R.1 fix).
    prereq_map = build_prerequisite_map(prerequisites)
    required = {
        gap["skill_id"]: gap.get("required_mastery", 0)
        for gap in skill_gaps
        if gap.get("skill_id")
    }

    recommendations = []

    for gap in skill_gaps:
        skill_id = gap["skill_id"]
        importance = gap.get("importance", "medium")

        skill_prereqs = sorted(prereq_map.get(skill_id, []))
        blocked_by = unresolved_prerequisites(
            skill_id, current_skills, required, prereq_map
        )

        recommendations.append({
            "skill_id": skill_id,
            "current_mastery": gap.get("current_mastery", 0),
            "required_mastery": gap.get("required_mastery", 0),
            "gap": gap.get("gap", 0),
            "importance": importance,
            # INTERVIEW: deterministic ranking untouched — prerequisite
            # readiness is reported, not smuggled into the score.
            "priority_score": gap.get("priority_score", 0),
            "prerequisites": skill_prereqs,
            "blocked_by": blocked_by,
            "readiness": "blocked" if blocked_by else "ready",
        })

    return recommendations
