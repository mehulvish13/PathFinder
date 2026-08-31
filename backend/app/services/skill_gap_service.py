from typing import Dict, List


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