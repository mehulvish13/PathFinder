"""Assessment engine — deterministic start/score/mastery-update (no LLM)."""
from __future__ import annotations

import json
from datetime import datetime as dt

from app.data_loader import load_skills
from app.models.assessment import AssessmentAttempt
from app.models.mastery_history import MasteryHistory
from app.services.assessment.question_bank import get_questions_for_skill

# INTERVIEW: 30% prior + 70% fresh quiz — prior evidence still counts, but new
# demonstrated performance dominates so retakes after studying actually move mastery.
BLEND_PRIOR = 0.3
BLEND_QUIZ = 0.7


def _valid_skill_ids() -> set:
    try:
        return {s["id"] for s in load_skills()}
    except Exception:
        return set()


def start_assessment(db, learner_id: int, skill_id: str, num_questions: int, required_mastery: float) -> tuple[AssessmentAttempt, list[dict]]:
    valid = _valid_skill_ids()
    if valid and skill_id not in valid:
        raise ValueError(f"Unknown skill_id: {skill_id}")
    questions = get_questions_for_skill(skill_id, num_questions, valid or None)
    if not questions:
        raise LookupError(f"No questions available for skill: {skill_id}")
    attempt = AssessmentAttempt(
        learner_id=learner_id,
        skill_id=skill_id,
        question_ids=json.dumps([q["id"] for q in questions]),
        required_mastery=float(required_mastery),
        status="started",
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt, questions


def _previous_mastery(db, learner_id: int, skill_id: str) -> float:
    latest = (
        db.query(MasteryHistory)
        .filter(
            MasteryHistory.learner_id == learner_id,
            MasteryHistory.skill_id == skill_id,
        )
        .order_by(MasteryHistory.recorded_at.desc(), MasteryHistory.id.desc())
        .first()
    )
    return float(latest.mastery) if latest else 0.0


def _build_result(attempt: AssessmentAttempt, questions: list[dict], answers: dict) -> dict:
    correct = 0
    feedback = []
    for q in questions:
        selected = answers.get(q["id"])
        ok = selected == q["correct_index"]
        if ok:
            correct += 1
        feedback.append(
            {
                "question_id": q["id"],
                "correct": ok,
                "selected_index": selected,
                "correct_index": q["correct_index"],
                "explanation": q["explanation"],
            }
        )
    total = len(questions)
    percentage = round(correct / total * 100, 2) if total else 0.0
    return {"correct": correct, "incorrect": total - correct, "total": total, "percentage": percentage, "feedback": feedback}


def submit_assessment(db, attempt: AssessmentAttempt, answers: list[dict]) -> dict:
    """Score a started attempt, blend mastery, record history. Idempotent: an
    already-submitted attempt returns its stored result without double-writing."""
    from app.services.assessment.question_bank import load_bank

    bank = {q["id"]: q for q in load_bank(_valid_skill_ids() or None)}
    questions = [bank[qid] for qid in attempt.question_id_list if qid in bank]
    if not questions:
        raise LookupError("Assessment questions no longer available in bank")

    clean: dict = {}
    for a in answers:
        qid = a.get("question_id")
        sel = a.get("selected_index")
        if qid not in bank or qid not in attempt.question_id_list:
            raise ValueError(f"Unknown question_id for this assessment: {qid}")
        if not isinstance(sel, int) or not (0 <= sel < len(bank[qid]["options"])):
            raise ValueError(f"selected_index out of range for {qid}")
        clean[qid] = sel  # INTERVIEW: last answer wins on duplicates — same as re-clicking an option in UI

    if attempt.status == "submitted":
        # INTERVIEW: recompute nothing — stored values make re-POST byte-identical and never double-append history
        pct = float(attempt.score or 0.0)
        prev = float(attempt.previous_mastery if attempt.previous_mastery is not None else 0.0)
        current = float(attempt.new_mastery if attempt.new_mastery is not None else pct)
        return _result_payload(attempt, pct, prev, current, questions, clean, resubmitted=True)

    scored = _build_result(attempt, questions, clean)
    pct = scored["percentage"]
    prev = _previous_mastery(db, attempt.learner_id, attempt.skill_id)
    new_mastery = round(BLEND_PRIOR * prev + BLEND_QUIZ * pct, 2)
    new_mastery = max(0.0, min(new_mastery, 100.0))

    db.add(
        MasteryHistory(
            learner_id=attempt.learner_id,
            skill_id=attempt.skill_id,
            mastery=new_mastery,
            source="quiz",
        )
    )
    attempt.status = "submitted"
    attempt.score = pct
    attempt.previous_mastery = prev
    attempt.new_mastery = new_mastery
    attempt.submitted_at = dt.utcnow()
    db.commit()
    db.refresh(attempt)
    return _result_payload(attempt, pct, prev, new_mastery, questions, clean, resubmitted=False, feedback=scored["feedback"])


def _result_payload(attempt, pct, prev, new_mastery, questions, answers, resubmitted, feedback=None) -> dict:
    from app.services.assessment.question_bank import load_bank

    if feedback is None:
        bank = {q["id"]: q for q in load_bank(_valid_skill_ids() or None)}
        qs = [bank[qid] for qid in attempt.question_id_list if qid in bank]
        feedback = [
            {
                "question_id": q["id"],
                "correct": answers.get(q["id"]) == q["correct_index"],
                "selected_index": answers.get(q["id"]),
                "correct_index": q["correct_index"],
                "explanation": q["explanation"],
            }
            for q in qs
        ]
    req = float(attempt.required_mastery or 70.0)
    payload = {
        "assessment_id": attempt.id,
        "learner_id": attempt.learner_id,
        "skill_id": attempt.skill_id,
        "correct": sum(1 for f in feedback if f["correct"]),
        "incorrect": sum(1 for f in feedback if not f["correct"]),
        "total": len(feedback),
        "percentage": pct,
        "previous_mastery": round(prev, 2),
        "new_mastery": round(new_mastery, 2),
        "required_mastery": req,
        "gap_before": round(max(req - prev, 0.0), 2),
        "gap_after": round(max(req - new_mastery, 0.0), 2),
        "status": "ready" if new_mastery >= req else "needs_work",
        "feedback": feedback,
    }
    if resubmitted:
        payload["note"] = "already submitted — stored result returned"
    return payload
