from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ActivityRequest(BaseModel):
    learner_id: int
    resource_id: str
    activity_type: str  # started, completed, practiced, quiz_attempt


class CompleteRequest(BaseModel):
    learner_id: int
    resource_id: str


class ProgressResponse(BaseModel):
    id: int
    learner_id: int
    resource_id: str
    status: str
    progress_percent: float
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SkillMasteryResponse(BaseModel):
    skill_id: str
    skill_name: str
    current_mastery: float
    target_mastery: float
    gap: float
    status: str  # ready, in_progress, blocked

    class Config:
        from_attributes = True


class LearnerProgressResponse(BaseModel):
    learner_id: int
    overall_progress: float
    total_resources: int
    completed_resources: int
    in_progress_resources: int
    not_started_resources: int
    milestones: List[dict] = Field(default_factory=list)
    next_action: str = "No action available"

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    learner_id: int
    overall_progress: float
    progress_bar: str  # Visual representation like "██████░░░░ 68%"
    total_resources: int
    completed_resources: int
    in_progress_resources: int
    not_started_resources: int
    skill_mastery: List[SkillMasteryResponse]
    milestones: List[dict]
    next_action: str
    estimated_time_remaining: float = 0.0
    hours_per_week: float = 10.0

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    learner_id: int
    title: str
    message: str
    type: str  # next_action, milestone, reminder, streak
    is_read: bool = False
    # INTERVIEW: Optional + default keeps in-app V1 notifications working when no persisted timestamp exists.
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CertificateResponse(BaseModel):
    learner_name: str
    target_career: str
    completion_percent: float
    skills_completed: List[str]
    completion_date: str
    certificate_id: str
    verified: bool

    class Config:
        from_attributes = True
