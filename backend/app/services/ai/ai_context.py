"""Build deterministic learner context for Phase 7 AI explanations/tutor.

The LLM receives facts produced by PathFinder's existing engines. It does not
calculate gaps, priorities, prerequisites, or roadmap order itself.
"""
from __future__ import annotations

from app.data_loader import load_career_requirements, load_careers, load_prerequisites, load_skills
from app.models.mastery_history import MasteryHistory
from app.services.adaptation.adaptation_service import resolve_career
from app.services.skills.skill_gap_service import calculate_skill_gaps
from app.services.recommendation.recommendation_service import recommend_skills


def _latest_mastery(db, learner_id: int) -> dict[str, float]:
    rows = (
        db.query(MasteryHistory)
        .filter(MasteryHistory.learner_id == learner_id)
        .order_by(MasteryHistory.recorded_at.desc(), MasteryHistory.id.desc())
        .all()
    )
    result: dict[str, float] = {}
    for row in rows:
        if row.skill_id not in result:
            result[row.skill_id] = float(row.mastery)
    return result


def build_context(db, learner_id: int, target_career: str, skill_id: str | None = None) -> dict:
    career = resolve_career(target_career)
    requirements = load_career_requirements(career["id"])
    if not requirements:
        raise ValueError(f"No skill requirements found for career: {target_career}")

    mastery = _latest_mastery(db, learner_id)
    prerequisites = load_prerequisites()
    gaps = calculate_skill_gaps(mastery, requirements)
    recommendations = recommend_skills(gaps, prerequisites, mastery)
    gap_by_id = {g["skill_id"]: g for g in gaps}
    req_by_id = {r["skill_id"]: r for r in requirements}
    names = {s["id"]: s["name"] for s in load_skills()}

    selected = None
    if skill_id:
        if skill_id not in req_by_id:
            raise ValueError(f"Skill '{skill_id}' is not required for career '{career['id']}'")
        selected = {
            "skill_id": skill_id,
            "name": names.get(skill_id, skill_id.replace("_", " ").title()),
            "current_mastery": round(mastery.get(skill_id, 0.0), 2),
            "required_mastery": float(req_by_id[skill_id]["required_mastery"]),
            "gap": round(max(float(req_by_id[skill_id]["required_mastery"]) - mastery.get(skill_id, 0.0), 0.0), 2),
            "importance": req_by_id[skill_id].get("importance", "medium"),
            "active_gap": gap_by_id.get(skill_id),
        }

    return {
        "career": {"id": career["id"], "name": career["name"]},
        "selected_skill": selected,
        "active_skill_gaps": gaps[:12],
        "top_recommendations": recommendations[:8],
        "mastery_snapshot": {k: round(v, 2) for k, v in sorted(mastery.items())},
        "prerequisites": [p for p in prerequisites if not skill_id or p["skill_id"] == skill_id or p["prerequisite_skill_id"] == skill_id],
        "rules": [
            "PathFinder determines skill gaps, prerequisites, priorities, and roadmap order deterministically.",
            "The AI may explain or teach the supplied context, but must not invent a different roadmap or mastery value.",
        ],
    }
