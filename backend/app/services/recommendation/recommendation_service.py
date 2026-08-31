from typing import Dict, List, Optional


def recommend_skills(
    skill_gaps: List[dict],
    prerequisites: Optional[List[dict]],
    current_skills: Dict[str, float]
) -> List[dict]:
    """
    Recommend skills based on gaps and prerequisites.
    
    This function takes the calculated skill gaps, prerequisite information,
    and current skill levels to provide personalized skill recommendations.
    
    Args:
        skill_gaps: List of skill gaps calculated by calculate_skill_gaps
        prerequisites: List of prerequisite relationships between skills
        current_skills: Dictionary of current skill mastery levels
    
    Returns:
        List of recommended skills with priority and prerequisite info
    """
    recommendations = []

    for gap in skill_gaps:
        skill_id = gap["skill_id"]
        importance = gap.get("importance", "medium")

        recommendations.append({
            "skill_id": skill_id,
            "current_mastery": gap.get("current_mastery", 0),
            "required_mastery": gap.get("required_mastery", 0),
            "gap": gap.get("gap", 0),
            "importance": importance,
            "priority_score": gap.get("priority_score", 0),
            "prerequisites": [],
            "blocked_by": [],
            "readiness": "ready"
        })

    return recommendations