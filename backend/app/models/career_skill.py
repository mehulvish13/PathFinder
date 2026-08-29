from sqlalchemy import Column, Integer, Float, String, ForeignKey
from app.db.database import Base


class CareerSkill(Base):
    __tablename__ = "career_skills"

    id = Column(Integer, primary_key=True, index=True)

    career_id = Column(
        Integer,
        ForeignKey("careers.id"),
        nullable=False
    )

    skill_id = Column(
        Integer,
        ForeignKey("skills.id"),
        nullable=False
    )

    required_mastery = Column(Float, default=60.0)
    importance = Column(String, default="medium")
