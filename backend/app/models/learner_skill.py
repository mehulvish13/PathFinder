from sqlalchemy import Column, Integer, Float, String, ForeignKey
from app.db.database import Base


class LearnerSkill(Base):
    __tablename__ = "learner_skills"

    id = Column(Integer, primary_key=True, index=True)

    learner_id = Column(
        Integer,
        ForeignKey("learners.id"),
        nullable=False
    )

    skill_id = Column(
        Integer,
        ForeignKey("skills.id"),
        nullable=False
    )

    mastery = Column(Float, default=0.0)
    source = Column(String, default="self_assessment")
