from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.adaptation import RecalculateRequest, RecalculateResponse
from app.services.adaptation.adaptation_service import recalculate

router = APIRouter(prefix="/api/adaptation", tags=["Adaptation"])


@router.post("/recalculate", response_model=RecalculateResponse)
def recalculate_path(request: RecalculateRequest, db: Session = Depends(get_db)):
    # INTERVIEW: thin route — all logic lives in adaptation_service.recalculate (same §5 rule as path/progress routes)
    try:
        return RecalculateResponse(**recalculate(
            db,
            learner_id=request.learner_id,
            target_career=request.target_career,
            hours_per_week=request.hours_per_week,
        ))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
