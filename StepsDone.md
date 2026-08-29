# Steps Done - PathFinder Backend Foundation

## Folder Structure Created

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── db/
│   │   ├── __init__.py
│   │   └── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── learner.py
│   │   ├── skill.py
│   │   ├── learner_skill.py
│   │   ├── career.py
│   │   ├── career_skill.py
│   │   └── prerequisite.py
│   ├── schemas/
│   │   └── __init__.py
│   └── services/
│       └── __init__.py
├── data/
│   ├── assessments/
│   ├── careers.json
│   ├── prerequisites.json
│   ├── projects.json
│   ├── resources.json
│   └── skills.json
├── venv/
└── requirements.txt
```

## Python Virtual Environment

Created with `python -m venv venv` and activated with `venv\Scripts\activate`

## Dependencies Installed

- fastapi
- uvicorn
- pydantic
- sqlalchemy

Generated via `pip freeze > requirements.txt`

## Database Configuration

**File:** `backend/app/db/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./pathfinder.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
```

**What this does:**
- `engine` - Connects FastAPI to SQLite
- `SessionLocal` - Creates database sessions
- `Base` - Acts as the parent for database models
- `get_db()` - Provides a database connection to an API request and closes it afterward

## Database Models

### 1. Learner Model

**File:** `backend/app/models/learner.py`

```python
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
```

**Fields:**
- id (primary key)
- name
- goal
- experience_level
- hours_per_week
- deadline_months

### 2. Skill Model

**File:** `backend/app/models/skill.py`

```python
from sqlalchemy import Column, Integer, String, Text
from app.db.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
```

**Example entries:**
- Python | Programming
- Machine Learning | AI/ML
- LLM Fundamentals | Generative AI
- Embeddings | Generative AI

### 3. LearnerSkill Model

**File:** `backend/app/models/learner_skill.py`

```python
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
```

**Purpose:** Links Learner to Skills with mastery level and source tracking

**Example:**
- Mehul → Python: 80, Machine Learning: 65, LLM: 30

### 4. Career Model

**File:** `backend/app/models/career.py`

```python
from sqlalchemy import Column, Integer, String, Text
from app.db.database import Base


class Career(Base):
    __tablename__ = "careers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
```

**Initial careers:**
- GenAI Engineer
- AI Engineer
- ML Engineer
- Data Scientist
- Backend Developer

### 5. CareerSkill Model

**File:** `backend/app/models/career_skill.py`

```python
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
```

**Example - GenAI Engineer:**
- Python → 70 → High
- ML → 60 → High
- LLM → 70 → High
- Embeddings → 60 → High
- RAG → 70 → High
- Docker → 50 → Medium

### 6. Prerequisite Model

**File:** `backend/app/models/prerequisite.py`

```python
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
```

**Purpose:** Defines the skill graph for learning sequence

**Example chain:**
- RAG
  - ↑ Vector Databases
    - ↑ Embeddings
      - ↑ LLM Fundamentals

### 7. Models Init

**File:** `backend/app/models/__init__.py`

```python
from app.models.learner import Learner
from app.models.skill import Skill
from app.models.learner_skill import LearnerSkill
from app.models.career import Career
from app.models.career_skill import CareerSkill
from app.models.prerequisite import Prerequisite
```

## Main Application

**File:** `backend/app/main.py`

```python
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
```

## Data Files (Empty)

Created in `backend/data/`:
- `careers.json`
- `skills.json`
- `prerequisites.json`
- `resources.json`
- `projects.json`
- `assessments/` (directory)

## Architecture Overview

```
React Frontend
      ↓
   FastAPI
      ↓
SQLAlchemy
      ↓
SQLite (pathfinder.db)
      ↓
PathFinder Engine
      ↓
Database / AI / Skills
```

## Server Command

From `backend/` directory:
```bash
uvicorn app.main:app --reload
```

Server runs at: http://127.0.0.1:8000

API Docs at: http://127.0.0.1:8000/docs

## Running the Server

From `backend/` directory:
```bash
uvicorn app.main:app --reload
```

**What happens:**
- `Base.metadata.create_all(bind=engine)` creates all database tables on startup
- `pathfinder.db` file is created automatically in `backend/` folder

**Tables created:**
- learners
- skills
- learner_skills
- careers
- career_skills
- prerequisites

## Check the Database

Use VS Code's SQLite extension or any SQLite viewer to inspect `pathfinder.db`

**Initial database structure:**

```
learners
skills
learner_skills
careers
career_skills
prerequisites
```

## Architecture After Phase 1B

```
                 PATHFINDER
                     │
                     ▼
                  FastAPI
                     │
                     ▼
                  SQLite
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
    Learner        Skills        Careers
       │             │             │
       └──────┬──────┘             │
              ▼                    ▼
       Learner Skills       Career Skills
              │
              ▼
        Skill Comparison
              │
              ▼
        Prerequisites
```

## Delayed Tables

The following tables will be added later (not yet created):

- resources
- projects
- learning_path
- path_items
- progress
- assessments

**Why:** We deliberately start with the minimum required for:

Learner → Career → Required Skills → Current Skills → Skill Gap → Prerequisites

## Phase 1C: Build PathFinder's Knowledge Base

Next step: Create the actual GenAI Engineer skill graph with:
- 40-50 skills
- Career requirements
- Prerequisite relationships
- Initial curated resources

This data becomes the foundation for the recommendation engine.

---

# Phase 1C: PathFinder Knowledge Base

## Overview

The knowledge base is what powers the recommendation engine:

- **Algorithm** = How PathFinder thinks
- **Knowledge Base** = What PathFinder knows

PathFinder's recommendation engine intelligently recommends skills because it knows:
- What careers require
- What skills exist
- Which skills depend on others
- What resources teach those skills
- What projects demonstrate them

## GenAI Engineer Skill Graph (40-50 Skills)

Organized into 10 domains:

### Domain 1: Programming Foundations
- Python
- Python OOP
- Data Structures
- Algorithms
- Git & GitHub
- REST APIs
- JSON & HTTP

### Domain 2: Mathematics & ML Foundations
- Statistics
- Probability
- Linear Algebra
- Machine Learning Fundamentals
- Model Evaluation
- Feature Engineering

### Domain 3: Deep Learning
- Neural Networks
- Backpropagation
- PyTorch
- TensorFlow
- Transformers
- Attention Mechanism

### Domain 4: Generative AI
- LLM Fundamentals
- Prompt Engineering
- Structured Outputs
- Function Calling
- LLM APIs
- Context Windows
- Tokenization

### Domain 5: Embeddings & Retrieval
- Embeddings
- Semantic Similarity
- Vector Databases
- Vector Search
- Chunking
- Metadata Filtering

### Domain 6: RAG
- RAG Fundamentals
- Document Ingestion
- Retrieval
- Reranking
- RAG Evaluation
- Hybrid Search

### Domain 7: AI Agents
- AI Agents
- Tool Calling
- ReAct
- Agent Memory
- Multi-step Workflows
- Agent Evaluation

### Domain 8: AI Application Engineering
- FastAPI
- Backend Architecture
- Authentication Concepts
- Caching
- Async Programming

### Domain 9: Deployment
- Docker
- Environment Management
- Cloud Deployment
- Logging & Monitoring
- MLOps Fundamentals

### Domain 10: Portfolio / Career
- AI System Design
- Production AI Practices
- Capstone Project
- Technical Documentation

## Skill Mastery

Every career requirement has a target mastery level (1-100).

**Example - GenAI Engineer:**
```
Python              70
ML Fundamentals     60
LLM Fundamentals    75
Embeddings          65
Vector Databases    65
RAG                 75
AI Agents           70
FastAPI             60
Docker              50
```

The number represents the level a learner should reach before PathFinder considers the skill sufficiently developed.

## Skill Relationships (Prerequisites)

Skills are stored as directed edges: `prerequisite → skill`

**Example chains:**

```
LLM Fundamentals
       ↓
Embeddings
       ↓
Vector Databases
       ↓
Retrieval
       ↓
RAG
```

```
Python
   ↓
FastAPI
   ↓
Backend Architecture
   ↓
AI Application
   ↓
Deployment
```

```
LLM Fundamentals
       ↓
Prompt Engineering
       ↓
Structured Outputs
       ↓
Tool Calling
       ↓
AI Agents
```

## Hard vs Soft Prerequisites

**Hard prerequisite:** Learner should normally understand the prerequisite first.
```
Embeddings → Vector Database
```

**Soft prerequisite:** Helpful, but not strictly required.
```
Statistics → Machine Learning
```
A strong learner may already understand enough statistics.

## Data Files

### backend/data/skills.json
Contains all ~50 skills organized by domain.

### backend/data/prerequisites.json
Stores skill relationships as directed edges.

### backend/data/careers.json
```
[
  {
    "id": "genai_engineer",
    "name": "GenAI Engineer",
    "description": "Builds AI applications using large language models, retrieval systems, agents and modern AI engineering practices."
  },
  {
    "id": "ai_engineer",
    "name": "AI Engineer",
    "description": "Designs and develops AI-powered software systems using machine learning and modern AI technologies."
  },
  {
    "id": "ml_engineer",
    "name": "ML Engineer",
    "description": "Builds, evaluates and deploys machine learning systems."
  },
  {
    "id": "data_scientist",
    "name": "Data Scientist",
    "description": "Uses statistics, machine learning and data analysis to solve business and analytical problems."
  },
  {
    "id": "backend_developer",
    "name": "Backend Developer",
    "description": "Builds scalable APIs, services and backend systems."
  }
]
```

### backend/data/career_skills.json
Career skill requirements with mastery levels (GenAI Engineer is primary focus).

## Three-Layer Architecture

```
CAREER
   │
   ▼
Required Skills
   │
   ▼
Skill Graph
   │
   ▼
Prerequisites
```

## How It Works

```
LEARNER brings: Current Skills

CAREER → Required Skills → compare with Current Skills → Skill Gaps
                                                 │
                                                 ▼
                                          Skill Graph
                                                 │
                                                 ▼
                                         Learning Sequence
```

## Validate JSON Files

From `backend/` directory, validate each JSON file:

```bash
python -m json.tool data/skills.json > nul
python -m json.tool data/prerequisites.json > nul
python -m json.tool data/careers.json > nul
python -m json.tool data/career_skills.json > nul
```

No output = valid JSON. Copy any errors if found.

## GitHub Commit Summary

✓ FastAPI foundation
✓ SQLite database foundation
✓ Core database models (6 tables)
✓ Skill knowledge base (~50 skills in 10 domains)
✓ Career knowledge base (5 careers)
✓ Prerequisite graph with hard/soft relationships
✓ GenAI Engineer skill requirements with mastery levels

## .gitignore Setup

Before committing, ensure root `.gitignore` contains:
```
venv/
.env
__pycache__/
*.pyc
*.db
```

## Commit Commands

```bash
git add .
git commit -m "feat: add PathFinder core knowledge base"
git push
```

---

# Phase 1D: Build the Skill Gap Engine

## Overview

The Skill Gap Engine makes the system actually reason about a learner's needs.

## How It Works

**Input:**
```
Learner says: Python = 80, ML = 65
```

**Process:**
```
Learner Current Skills
        ↓
GenAI Engineer Requirements
        ↓
Skill Gap Engine (compares)
        ↓
Output: Skill Gaps with mastery points
```

**Example Output:**
```
LLM = 45 point gap
Embeddings = 65 point gap
RAG = 75 point gap
Vector Databases = 65 point gap
...
```

Then the engine respects prerequisites and produces the first real personalized learning sequence.

## Skill Gap Calculation

```
Skill Gap = Required Mastery - Current Mastery
```

Example:
- RAG requires 75 mastery for GenAI Engineer
- Learner has 0 mastery in RAG
- Skill Gap = 75 - 0 = 75

## From Gaps to Learning Sequence

```
Skill Gaps
    │
    ▼
Skill Graph (Prerequisites)
    │
    ▼
Topological Sort
    │
    ▼
Learning Sequence
```

The engine will:
1. Calculate all skill gaps
2. Sort by prerequisite order (respecting hard/soft prerequisites)
3. Produce a sequenced learning path

## Upcoming

- Data loader to populate the database from JSON
- Skill Gap calculation service
- Learning sequence generator
- API endpoints for learner registration
- Career selection endpoint
- Gap analysis endpoint
