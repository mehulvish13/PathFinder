# INTERVIEW PREP: See backend/docs/INTERVIEW_PREP_COMMIT4.md (planned) — Resource Matcher section
# Q: Why deterministic 50/20/20/10 not LLM/embeddings? / How explain recommendation?
from typing import List, Optional


DIFFICULTY_LEVEL = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3,
}  # INTERVIEW: numeric levels enable distance scoring 0→20 / 1→10, keeps matching explainable


def calculate_resource_score(
    resource: dict,
    learner_level: str,
    learning_preference: Optional[str] = None,
    max_hours: Optional[float] = None,
) -> float:

    score = 0.0

    # INTERVIEW: +50 guaranteed by skill_id filter below — matcher personalizes HOW, not WHAT
    score += 50

    # Difficulty fit
    learner_value = DIFFICULTY_LEVEL.get(
        learner_level,
        1
    )

    resource_value = DIFFICULTY_LEVEL.get(
        resource.get("difficulty", "beginner"),
        1
    )

    difference = abs(
        learner_value - resource_value
    )

    if difference == 0:
        score += 20
    elif difference == 1:
        score += 10

    # INTERVIEW: preference project→project +20, theory→course/docs/tutorial +20, mixed→+10 — same skill, different experience
    if learning_preference:
        preference = learning_preference.lower()

        resource_type = resource.get(
            "type",
            ""
        ).lower()

        if (
            "project" in preference
            and resource_type == "project"
        ):
            score += 20

        elif (
            "theory" in preference
            and resource_type in [
                "course",
                "documentation",
                "tutorial"
            ]
        ):
            score += 20

        elif (
            "mixed" in preference
        ):
            score += 10

    # INTERVIEW: time-fit +10 if estimated<=max_hours — respects weekly availability without hard exclusion
    if max_hours is not None:
        estimated = resource.get(
            "estimated_hours",
            999
        )

        if estimated <= max_hours:
            score += 10

    return score


def recommend_resources(
    skill_id: str,
    resources: List[dict],
    learner_level: str = "beginner",
    learning_preference: Optional[str] = None,
    max_hours: Optional[float] = None,
    limit: int = 5,
) -> List[dict]:

    # INTERVIEW: filter by == skill_id first — invented IDs return [], path still works (graceful degradation)
    candidates = [
        resource
        for resource in resources
        if resource.get("skill_id") == skill_id
    ]

    scored = []

    for resource in candidates:

        score = calculate_resource_score(
            resource,
            learner_level,
            learning_preference,
            max_hours,
        )

        scored.append({
            **resource,
            "recommendation_score": round(
                score,
                2
            )
        })

    scored.sort(
        key=lambda item: item["recommendation_score"],
        reverse=True
    )

    return scored[:limit]