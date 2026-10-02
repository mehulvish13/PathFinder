# INTERVIEW PREP: See backend/docs/INTERVIEW_PREP_COMMIT6.md — Adaptation section (planned)
# Q: Why orchestration not a new engine? / Why cleared_skills derived? / Why dict fields?
from pydantic import BaseModel, Field
from typing import List, Optional


class RecalculateRequest(BaseModel):
    learner_id: int
    target_career: str  # INTERVIEW: id or display name — resolve_career accepts both, 404 otherwise
    hours_per_week: float = Field(default=10.0, gt=0)  # INTERVIEW: gt=0 — weeks math divides by this


class RecalculateResponse(BaseModel):
    learner_id: int
    career_id: str
    target_career: str
    hours_per_week: float
    cleared_skills: List[str] = Field(default_factory=list)
    skill_gaps: List[dict] = Field(default_factory=list)
    recommendations: List[dict] = Field(default_factory=list)
    # INTERVIEW: dict (not nested Roadmap model) — envelope mirrors POST /api/path/generate so one frontend renderer serves both
    learning_path: dict = Field(default_factory=dict)
    roadmap: dict = Field(default_factory=dict)

    class Config:
        from_attributes = True


class SubmitWithAdaptationMixin(BaseModel):
    # INTERVIEW: optional → old submit clients unchanged; present → result carries the regenerated roadmap, no second call needed
    target_career: Optional[str] = None
    hours_per_week: float = Field(default=10.0, gt=0)
