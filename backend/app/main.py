from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.profile import router as profile_router
from app.api.routes.path import router as path_router
from app.api.routes.progress import router as progress_router
from app.api.routes.assessment import router as assessment_router
from app.api.routes.adaptation import router as adaptation_router
from app.api.routes.ai_tutor import router as ai_tutor_router

from app.db.database import Base, engine
from app.models import (
    Learner,
    Skill,
    LearnerSkill,
    Career,
    CareerSkill,
    Prerequisite,
    Activity,
    Progress,
    MasteryHistory,
    AssessmentAttempt,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PathFinder API",
    description="AI-Powered Personalized Learning Path Recommender",
    version="0.1.0"
)

# Allow the local React dev server (Vite) to call the API from the browser.
# Origins are limited to local development hosts.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(path_router)
app.include_router(profile_router)
app.include_router(progress_router)
app.include_router(assessment_router)
app.include_router(adaptation_router)
app.include_router(ai_tutor_router)


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
