from fastapi import FastAPI

from app.db.database import Base, engine
from app.models import (
    Learner,
    Skill,
    LearnerSkill,
    Career,
    CareerSkill,
    Prerequisite,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PathFinder API",
    description="AI-Powered Personalized Learning Path Recommender",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "message": "PathFinder API is running",
        "version": "0.1.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
