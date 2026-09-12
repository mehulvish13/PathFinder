# INTERVIEW PREP: See backend/docs/INTERVIEW_PREP_COMMIT4.md (planned) — Resource schema section
# Q: Why Pydantic for resources? / Why canonical skill_id? / Why gt=0 for hours?
from pydantic import BaseModel, Field
from typing import List, Optional


class Resource(BaseModel):
    id: str
    title: str
    type: str  # INTERVIEW: restrict to course|tutorial|documentation|project|assessment — keeps matcher predictable
    skill_id: str  # INTERVIEW: must ∈ skills_catalog.json — matcher filters by ==, invented IDs return 0 results
    difficulty: str  # INTERVIEW: beginner|intermediate|advanced only — enables distance scoring 0→20 / 1→10
    estimated_hours: float = Field(gt=0)  # INTERVIEW: gt=0 blocks zero/negative hours that would cheat time-fit +10
    url: Optional[str] = None  # INTERVIEW: Optional — V1 curated may have offline docs; temp example.com ok for tests only
    description: str = ""
    tags: List[str] = Field(default_factory=list)  # INTERVIEW: default_factory avoids mutable-default shared-list bug