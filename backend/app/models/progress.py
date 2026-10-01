from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.db.database import Base


# INTERVIEW: Mutable state snapshot for fast UI rendering; UniqueConstraint(learner,resource) makes Mark Complete idempotent under rapid clicks.
class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (
        UniqueConstraint("learner_id", "resource_id", name="uq_learner_resource"),
    )

    id = Column(Integer, primary_key=True, index=True)
    learner_id = Column(
        Integer,
        ForeignKey("learners.id"),
        nullable=False,
        index=True,
    )
    resource_id = Column(String, nullable=False)
    status = Column(String, nullable=False, default="not_started")
    progress_percent = Column(Float, default=0.0)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
