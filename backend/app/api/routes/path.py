from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List, Optional

from app.services.skills.skill_gap_service import (
    calculate_skill_gaps
)

from app.services.recommendation.recommendation_service import (
    recommend_skills
)

from app.services.path.path_generator import (
    generate_learning_path
)

from app.data_loader import load_resources


router = APIRouter(
    prefix="/api/path",
    tags=["Learning Path"]
)


class PathRequest(BaseModel):
    current_skills: Dict[str, float]
    career_requirements: List[dict]
    prerequisites: List[dict]
    # INTERVIEW: optional resource personalization — old clients still work (backward compatible)
    learner_level: Optional[str] = "beginner"
    learning_preference: Optional[str] = None
    max_hours: Optional[float] = None
    resource_limit: Optional[int] = 3


@router.post("/generate")
def generate_path(request: PathRequest):
    gaps = calculate_skill_gaps(
        request.current_skills,
        request.career_requirements
    )

    recommendations = recommend_skills(
        gaps,
        request.prerequisites,
        request.current_skills
    )

    # INTERVIEW: curated resources via loader — same canonical IDs join gaps→path→resources
    resources = load_resources()

    path = generate_learning_path(
        recommendations,
        request.prerequisites,
        resources=resources,
        learner_level=request.learner_level or "beginner",
        learning_preference=request.learning_preference,
        max_hours=request.max_hours,
        resource_limit=request.resource_limit or 3,
    )

    return {
        "skill_gaps": gaps,
        "recommendations": recommendations,
        "learning_path": path
    }