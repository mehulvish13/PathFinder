import json
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


# INTERVIEW: Attempt stores question_ids as JSON text (not a join table) — V1 quizzes are small, immutable snapshots; bank edits never rewrite history.
class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    learner_id = Column(
        Integer,
        ForeignKey("learners.id"),
        nullable=False,
        index=True,
    )
    skill_id = Column(String, nullable=False, index=True)
    question_ids = Column(String, nullable=False, default="[]")
    required_mastery = Column(Float, nullable=False, default=70.0)
    status = Column(String, nullable=False, default="started")
    score = Column(Float, nullable=True)
    # INTERVIEW: store prev/new at submit time — re-POST returns identical numbers without re-deriving history
    previous_mastery = Column(Float, nullable=True)
    new_mastery = Column(Float, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())

    @property
    def question_id_list(self) -> list:
        try:
            ids = json.loads(self.question_ids or "[]")
            return ids if isinstance(ids, list) else []
        except (ValueError, TypeError):
            return []
