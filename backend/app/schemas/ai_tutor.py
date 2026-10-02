from pydantic import BaseModel, Field
from typing import Optional


class AIExplainRequest(BaseModel):
    learner_id: int
    target_career: str
    skill_id: str
    hours_per_week: float = Field(default=10.0, gt=0)
    focus: Optional[str] = None


class AITutorRequest(BaseModel):
    learner_id: int
    target_career: str
    question: str = Field(min_length=1, max_length=2000)
    skill_id: Optional[str] = None
    hours_per_week: float = Field(default=10.0, gt=0)


class AIResponse(BaseModel):
    learner_id: int
    target_career: str
    skill_id: Optional[str] = None
    answer: str
    context: dict = Field(default_factory=dict)
