from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


# INTERVIEW: Longitudinal time-series (no FK to skills.id) — canonical skill IDs are strings from skills_catalog.json while skills.id is legacy Integer; storing canonical string keeps V1 working without a migration.
class MasteryHistory(Base):
    __tablename__ = "mastery_history"

    id = Column(Integer, primary_key=True, index=True)
    learner_id = Column(
        Integer,
        ForeignKey("learners.id"),
        nullable=False,
        index=True,
    )
    skill_id = Column(
        String,
        nullable=False,
        index=True,
    )
    mastery = Column(Float, nullable=False)
    recorded_at = Column(DateTime, nullable=False, default=func.now())
    source = Column(String, nullable=False)
