from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.assessment import AssessmentAttempt
from app.schemas.assessment import (
    AssessmentDetailResponse,
    AssessmentResultResponse,
    AssessmentStartRequest,
    AssessmentStartResponse,
    AssessmentSubmitRequest,
    QuestionPublic,
)
from app.services.assessment.assessment_service import start_assessment, submit_assessment
from app.services.assessment.question_bank import load_bank
from app.data_loader import load_skills

router = APIRouter(prefix="/api/assessment", tags=["Assessment"])


def _public_questions(question_ids: list[str]) -> list[dict]:
    bank = {q["id"]: q for q in load_bank({s["id"] for s in load_skills()})}
    return [bank[qid] for qid in question_ids if qid in bank]


@router.post("/start", response_model=AssessmentStartResponse)
def start(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    # INTERVIEW: 404s distinguish "skill doesn't exist" from "skill exists but has no quiz yet" — different fixes
    try:
        attempt, questions = start_assessment(
            db,
            learner_id=request.learner_id,
            skill_id=request.skill_id,
            num_questions=request.num_questions,
            required_mastery=request.required_mastery,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return AssessmentStartResponse(
        assessment_id=attempt.id,
        learner_id=attempt.learner_id,
        skill_id=attempt.skill_id,
        num_questions=len(questions),
        questions=[
            QuestionPublic(
                question_id=q["id"],
                skill_id=q["skill_id"],
                question=q["question"],
                options=q["options"],
                difficulty=q["difficulty"],
            )
            for q in questions
        ],
    )


@router.post("/submit", response_model=AssessmentResultResponse)
def submit(request: AssessmentSubmitRequest, db: Session = Depends(get_db)):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == request.assessment_id).first()
    if attempt is None:
        raise HTTPException(status_code=404, detail=f"Assessment not found: {request.assessment_id}")
    try:
        result = submit_assessment(db, attempt, [a.model_dump() for a in request.answers])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return AssessmentResultResponse(**{k: v for k, v in result.items() if k != "note"})


@router.get("/{assessment_id}", response_model=AssessmentDetailResponse)
def get_assessment(assessment_id: int, db: Session = Depends(get_db)):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == assessment_id).first()
    if attempt is None:
        raise HTTPException(status_code=404, detail=f"Assessment not found: {assessment_id}")
    questions = _public_questions(attempt.question_id_list)
    return AssessmentDetailResponse(
        assessment_id=attempt.id,
        learner_id=attempt.learner_id,
        skill_id=attempt.skill_id,
        status=attempt.status,
        num_questions=len(questions),
        questions=[
            QuestionPublic(
                question_id=q["id"],
                skill_id=q["skill_id"],
                question=q["question"],
                options=q["options"],
                difficulty=q["difficulty"],
            )
            for q in questions
        ],
        percentage=float(attempt.score) if attempt.score is not None else None,
        submitted_at=attempt.submitted_at.isoformat() if attempt.submitted_at else None,
    )


@router.get("/{assessment_id}/result", response_model=AssessmentResultResponse)
def get_result(assessment_id: int, db: Session = Depends(get_db)):
    # INTERVIEW: replay from stored columns — identical numbers on every GET; per-question
    # selections live only in the POST /submit response (V1 stores outcomes, not answer sheets)
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == assessment_id).first()
    if attempt is None:
        raise HTTPException(status_code=404, detail=f"Assessment not found: {assessment_id}")
    if attempt.status != "submitted":
        raise HTTPException(status_code=400, detail="Result not available — assessment not submitted yet")
    total = len(attempt.question_id_list)
    pct = float(attempt.score or 0.0)
    prev = float(attempt.previous_mastery or 0.0)
    new = float(attempt.new_mastery if attempt.new_mastery is not None else pct)
    req = float(attempt.required_mastery or 70.0)
    correct = int(round(pct / 100 * total)) if total else 0
    return AssessmentResultResponse(
        assessment_id=attempt.id,
        learner_id=attempt.learner_id,
        skill_id=attempt.skill_id,
        correct=correct,
        incorrect=total - correct,
        total=total,
        percentage=pct,
        previous_mastery=round(prev, 2),
        new_mastery=round(new, 2),
        required_mastery=req,
        gap_before=round(max(req - prev, 0.0), 2),
        gap_after=round(max(req - new, 0.0), 2),
        status="ready" if new >= req else "needs_work",
        feedback=[],
    )
