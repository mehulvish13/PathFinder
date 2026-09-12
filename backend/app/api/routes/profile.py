# INTERVIEW PREP: See backend/docs/INTERVIEW_PREP_COMMIT3.md — API & Validation Layers section
from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.schemas.profile import LearnerProfile


router = APIRouter(
    prefix="/api/profile",
    tags=["Learner Profile"]
)


@router.post("/create")
def create_profile(profile: LearnerProfile):

    return {
        "message": "Learner profile created successfully",
        "profile": profile
    }


@router.post("/extract")
def extract_profile(payload: dict):

    user_message = payload.get("message")

    if not user_message:
        raise HTTPException(
            status_code=400,
            detail="Message is required."
        )

    # Knowledge loading — uses defensive loader compatible with current data files
    from app.data_loader import load_skills, load_careers
    from app.services.ai.llm_service import LLMService

    skills = load_skills()
    careers = load_careers()

    llm = LLMService()

    extracted = llm.extract_learner_profile(
        user_message=user_message,
        available_skills=skills,
        available_careers=careers,
    )

    # INTERVIEW: Defense-in-depth — prompt says "only use valid IDs" but we still filter; never trust LLM output
    # Filter out skills not in our catalog (LLMs sometimes invent skill IDs)
    valid_skill_ids = {s["id"] for s in skills}
    if "skills" in extracted:
        extracted["skills"] = [
            s for s in extracted["skills"]
            if s.get("skill_id") in valid_skill_ids
        ]

    # INTERVIEW: Canonical ID check — "Data Scientist" != "data_scientist"; downstream joins depend on exact ID
    # Ensure target_career is a valid career ID
    valid_career_ids = {c["id"] for c in careers}
    if extracted.get("target_career") not in valid_career_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid career: {extracted.get('target_career')}. Must be one of: {sorted(valid_career_ids)}"
        )

    # INTERVIEW: Final gate — Pydantic validates ranges/types; ValidationError → 400 not 500
    # Pydantic validation: LLM JSON → reliable LearnerProfile
    try:
        validated_profile = LearnerProfile(**extracted)
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Profile extraction failed validation: {e}"
        )

    return {
        "message": "Learner profile extracted successfully",
        "profile": validated_profile,
    }