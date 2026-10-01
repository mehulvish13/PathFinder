from pydantic import BaseModel, Field
from typing import List, Optional


class RoadmapResource(BaseModel):
    resource_id: str
    title: str
    type: str
    estimated_hours: float


class RoadmapSkill(BaseModel):
    skill_id: str
    current_mastery: float
    target_mastery: float
    gap: float
    resources: List[RoadmapResource] = Field(
        default_factory=list
    )


class Milestone(BaseModel):
    id: str
    title: str
    description: str
    skills: List[str] = Field(
        default_factory=list
    )


class RoadmapPhase(BaseModel):
    id: str
    title: str
    description: str
    skills: List[RoadmapSkill] = Field(
        default_factory=list
    )
    milestone: Milestone
    estimated_hours: float


class Roadmap(BaseModel):
    title: str
    target_career: str
    total_estimated_hours: float
    # INTERVIEW: additive V1 calendar estimate (total_hours / hours_per_week); Optional so old clients/tests keep passing.
    estimated_weeks: Optional[float] = None
    phases: List[RoadmapPhase] = Field(
        default_factory=list
    )
    next_action: str