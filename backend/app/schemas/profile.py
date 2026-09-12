# INTERVIEW PREP: See backend/docs/INTERVIEW_PREP_COMMIT3.md — Schema & Validation section
# Q: Why Field(default_factory=list) vs = []? / Why Optional[str] for experience_level?
from pydantic import BaseModel, Field
from typing import List, Optional


class LearnerSkill(BaseModel):
    skill_id: str
    mastery: float = Field(ge=0, le=100)  # INTERVIEW: ge/le enforces 0-100 at validation boundary
    confidence: float = Field(default=0.5, ge=0, le=1)  # INTERVIEW: default + range guards LLM hallucination


class LearnerProfile(BaseModel):
    name: Optional[str] = None

    target_career: str

    goal_description: Optional[str] = None

    experience_level: Optional[str] = None  # INTERVIEW: must be Optional — LLM returns null when user omits experience

    skills: List[LearnerSkill] = Field(default_factory=list)  # INTERVIEW: default_factory avoids mutable-default bug (shared [] across instances)

    completed_courses: List[str] = Field(default_factory=list)

    completed_projects: List[str] = Field(default_factory=list)

    interests: List[str] = Field(default_factory=list)

    hours_per_week: Optional[float] = None

    deadline: Optional[str] = None

    learning_preference: Optional[str] = None