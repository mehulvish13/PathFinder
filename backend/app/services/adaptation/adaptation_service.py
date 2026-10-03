"""Phase 6 orchestration — reread mastery, rerun the existing engines.

INTERVIEW: this layer owns NO scoring logic. It only (1) resolves the career,
(2) snapshots latest mastery per skill, (3) calls gap → recommend → path →
roadmap in the same order as POST /api/path/generate, so adaptation can never
disagree with a fresh path request for the same learner state.
"""
from __future__ import annotations

from app.data_loader import (
    load_career_requirements,
    load_careers,
    load_prerequisites,
    load_resources,
)
from app.models.mastery_history import MasteryHistory
from app.services.path.path_generator import generate_learning_path
from app.services.recommendation.recommendation_service import recommend_skills
from app.services.roadmap import generate_roadmap
from app.services.skills.skill_gap_service import calculate_skill_gaps


def resolve_career(target_career: str) -> dict:
    """Accept canonical id or display name (case-insensitive) → {id, name}."""
    raw = (target_career or "").strip()
    if not raw:
        raise ValueError("target_career is required")
    for c in load_careers():
        if raw == c["id"] or raw == c["name"] or raw.lower() == c["id"].lower():
            return c
    raise ValueError(f"Unknown career: {target_career}")


def latest_mastery_map(db, learner_id: int) -> dict:
    """Latest MasteryHistory.mastery per skill_id for one learner."""
    rows = (
        db.query(MasteryHistory)
        .filter(MasteryHistory.learner_id == learner_id)
        .order_by(MasteryHistory.recorded_at.desc(), MasteryHistory.id.desc())
        .all()
    )
    current: dict = {}
    for r in rows:
        if r.skill_id not in current:
            current[r.skill_id] = float(r.mastery)
    return current


def recalculate(
    db,
    learner_id: int,
    target_career: str,
    hours_per_week: float = 10.0,
    learner_level: str = "beginner",
) -> dict:
    career = resolve_career(target_career)
    requirements = load_career_requirements(career["id"])
    if not requirements:
        raise ValueError(f"No skill requirements found for career: {target_career}")
    prerequisites = load_prerequisites()

    current_skills = latest_mastery_map(db, learner_id)
    gaps = calculate_skill_gaps(current_skills, requirements)
    recommendations = recommend_skills(gaps, prerequisites, current_skills)
    path = generate_learning_path(
        recommendations,
        prerequisites,
        resources=load_resources(),
        learner_level=learner_level or "beginner",
        # INTERVIEW: same mastery source the gaps were computed from, so
        # prerequisite readiness can never disagree with the skill gaps.
        current_skills=current_skills,
        career_requirements=requirements,
    )
    roadmap = generate_roadmap(
        learning_path=path.get("learning_path", []),
        target_career=career["name"],
        hours_per_week=hours_per_week or 10.0,
    )

    # INTERVIEW: gap engine drops mastered skills (gap 0), so "cleared" is derived:
    # required AND current >= required AND absent from active gaps.
    gap_ids = {g["skill_id"] for g in gaps}
    cleared = sorted(
        req["skill_id"]
        for req in requirements
        if req["skill_id"] not in gap_ids
        and current_skills.get(req["skill_id"], 0.0) >= float(req["required_mastery"])
    )

    return {
        "learner_id": learner_id,
        "career_id": career["id"],
        "target_career": career["name"],
        "hours_per_week": float(hours_per_week or 10.0),
        "cleared_skills": cleared,
        "skill_gaps": gaps,
        "recommendations": recommendations,
        "learning_path": path,
        "roadmap": roadmap,
    }
