from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.ai_tutor import AIExplainRequest, AITutorRequest, AIResponse
from app.services.ai.ai_context import build_context
from app.services.ai.llm_service import LLMService

router = APIRouter(prefix="/api/ai", tags=["AI Tutor"])


def _run(prompt: str) -> str:
    try:
        return LLMService().generate_tutor_response(prompt)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ImportError as e:
        raise HTTPException(status_code=503, detail=str(e))


def _explain_prompt(context: dict, focus: str | None) -> str:
    return f"""You are PathFinder's learning coach. Explain the learner's current learning state clearly and practically.

FACTS FROM PATHFINDER (treat these as authoritative):
{context}

TASK:
Explain the selected skill in relation to this learner. Cover:
1. Why the skill matters for the target career.
2. The learner's current mastery and gap, using the supplied numbers exactly.
3. Why it appears where it does in the current learning path, including prerequisites when relevant.
4. What the learner should do next, using the supplied recommendations.
5. One small practical exercise.

Optional learner focus: {focus or "general understanding"}

Do not invent mastery scores, prerequisites, resources, or roadmap changes. Do not claim that you performed an assessment. Keep the response concise and actionable."""


def _tutor_prompt(context: dict, question: str) -> str:
    return f"""You are PathFinder's AI tutor.

PATHFINDER CONTEXT:
{context}

LEARNER QUESTION:
{question}

Answer as a patient technical tutor. Teach the concept with intuition first, then a concrete example, then a short practice task when useful. Connect the answer to the selected skill and learner state when supplied.

Rules:
- Use the supplied PathFinder context as authoritative for mastery, gaps, prerequisites, and career path.
- Do not invent learner progress or claim an action was completed.
- Do not silently change the recommended roadmap.
- If the question is outside the supplied learning context, say what additional context would be needed.
- Prefer simple technical language suitable for a learner building toward the target career."""


@router.post("/explain", response_model=AIResponse)
def explain(request: AIExplainRequest, db: Session = Depends(get_db)):
    try:
        context = build_context(db, request.learner_id, request.target_career, request.skill_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    answer = _run(_explain_prompt(context, request.focus))
    return AIResponse(learner_id=request.learner_id, target_career=context["career"]["name"], skill_id=request.skill_id, answer=answer, context=context)


@router.post("/tutor", response_model=AIResponse)
def tutor(request: AITutorRequest, db: Session = Depends(get_db)):
    try:
        context = build_context(db, request.learner_id, request.target_career, request.skill_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    answer = _run(_tutor_prompt(context, request.question))
    return AIResponse(learner_id=request.learner_id, target_career=context["career"]["name"], skill_id=request.skill_id, answer=answer, context=context)
