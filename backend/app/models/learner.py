from sqlalchemy import Column, Integer, String, Float
from app.db.database import Base


class Learner(Base):
    __tablename__ = "learners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    goal = Column(String, nullable=False)
    experience_level = Column(String, nullable=False)
    hours_per_week = Column(Float, nullable=False)
    deadline_months = Column(Integer, nullable=False)
