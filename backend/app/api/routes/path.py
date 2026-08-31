from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List

from app.services.skills.skill_gap_service import (
    calculate_skill_gaps
)

from app.services.recommendation.recommendation_service import (
    recommend_skills
)

from app.services.path.path_generator import (
    generate_learning_path
)


router = APIRouter(
    prefix="/api/path",
    tags=["Learning Path"]
)


class PathRequest(BaseModel):
    current_skills: Dict[str, float]
    career_requirements: List[dict]
    prerequisites: List[dict]


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

    path = generate_learning_path(
        recommendations,
        request.prerequisites
    )

    return {
        "skill_gaps": gaps,
        "recommendations": recommendations,
        "learning_path": path
    }