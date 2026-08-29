from sqlalchemy import Column, Integer, String, Text
from app.db.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
