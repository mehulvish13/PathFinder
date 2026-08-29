from sqlalchemy import Column, Integer, ForeignKey, String
from app.db.database import Base


class Prerequisite(Base):
    __tablename__ = "prerequisites"

    id = Column(Integer, primary_key=True, index=True)

    skill_id = Column(
        Integer,
        ForeignKey("skills.id"),
        nullable=False
    )

    prerequisite_skill_id = Column(
        Integer,
        ForeignKey("skills.id"),
        nullable=False
    )

    prerequisite_type = Column(
        String,
        default="hard"
    )
