from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


# INTERVIEW: Append-only event log (every click/session) kept separate from mutable Progress snapshot for analytics + debugging.
class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    learner_id = Column(
        Integer,
        ForeignKey("learners.id"),
        nullable=False,
        index=True,
    )
    resource_id = Column(String, nullable=False)
    activity_type = Column(String, nullable=False)
    started_at = Column(DateTime, nullable=False, default=func.now())
    completed_at = Column(DateTime, nullable=True)
