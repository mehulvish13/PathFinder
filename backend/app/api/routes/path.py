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
from app.services.roadmap import generate_roadmap

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
    # INTERVIEW: roadmap personalization — optional so old clients keep working; resolved to canonical career name below.
    target_career: Optional[str] = None
    hours_per_week: Optional[float] = 10.0


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
        # INTERVIEW: mastery context lets the generator judge prerequisites
        # that are not recommended steps (mastered/out-of-career skills).
        current_skills=request.current_skills,
        career_requirements=request.career_requirements,
    )
    
    # Generate roadmap from learning path
    # INTERVIEW: resolve target_career to canonical name (data_scientist -> Data Scientist) so a DS learner never gets a GenAI-labeled roadmap; default keeps old clients working.
    from app.data_loader import load_careers

    raw_career = (request.target_career or "").strip() or "GenAI Engineer"
    canonical_name = raw_career
    try:
        for c in load_careers():
            if c["id"] == raw_career or c["name"] == raw_career:
                canonical_name = c["name"]
                break
            if c["id"].lower() == raw_career.lower():
                canonical_name = c["name"]
                break
    except Exception:
        pass
    roadmap = generate_roadmap(
        learning_path=path.get("learning_path", []),
        target_career=canonical_name,
        hours_per_week=request.hours_per_week or 10.0,
    )

    return {
        "skill_gaps": gaps,
        "recommendations": recommendations,
        "learning_path": path,
        "roadmap": roadmap
    }