# PathFinder

AI-Powered Personalized Learning Path Recommender

## Quick Start

Run the server:
```bash
cd backend
TapTostart-Server.bat
```

Or manually:
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

Access:
- API: http://127.0.0.1:8000
- Docs: http://127.0.0.1:8000/docs

## Architecture

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

## Database Tables

- learners
- skills
- learner_skills
- careers
- career_skills
- prerequisites

## Skill Domains (Phase 1C)

1. Programming Foundations
2. Mathematics & ML Foundations
3. Deep Learning
4. Generative AI
5. Embeddings & Retrieval
6. RAG
7. AI Agents
8. AI Application Engineering
9. Deployment
10. Portfolio / Career

## Recommendation Flow

```
LEARNER ──── Current Skills
                │
CAREER ──── Required Skills
                │
           Skill Gaps
                │
       Skill Graph (Prerequisites)
                │
        Learning Sequence
```

## Project Structure

```
backend/
├── app/
│   ├── main.py
│   ├── db/database.py
│   ├── models/
│   ├── schemas/
│   └── services/
├── data/
│   ├── skills.json
│   ├── prerequisites.json
│   ├── careers.json
│   ├── career_skills.json
│   ├── resources.json
│   ├── projects.json
│   └── assessments/
└── requirements.txt
```

## Careers

- GenAI Engineer (primary focus)
- AI Engineer
- ML Engineer
- Data Scientist
- Backend Developer

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

## Recommendation Engine Flow

```
                  CAREER
                     │
                     ▼
              Required Skills
                     │
                     │ compare
                     ▼
LEARNER ───────► Current Skills
                     │
                     ▼
                 Skill Gaps
                     │
                     ▼
              Skill Graph
                     │
                     ▼
             Learning Sequence
```

## Knowledge Base Files

- `data/skills.json` - ~50 skills organized by domain
- `data/prerequisites.json` - Skill relationships as directed edges
- `data/careers.json` - Career definitions
- `data/career_skills.json` - Career skill requirements with mastery levels

## Validate JSON Files

From `backend/` directory:
```bash
python -m json.tool data/skills.json > nul
python -m json.tool data/prerequisites.json > nul
python -m json.tool data/careers.json > nul
python -m json.tool data/career_skills.json > nul
```
No output = valid JSON.

## GitHub Commit Summary

✓ FastAPI foundation
✓ SQLite database foundation
✓ Core database models (6 tables)
✓ Skill knowledge base (~50 skills in 10 domains)
✓ Career knowledge base (5 careers)
✓ Prerequisite graph with hard/soft relationships
✓ GenAI Engineer skill requirements with mastery levels

## Git Setup

Before committing, ensure `.gitignore` contains:
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

## Next: Phase 1D - Skill Gap Engine

The system will reason:

**Input:**
- Learner: Python = 80, ML = 65

**Process:**
```
Learner Current Skills
        ↓
GenAI Engineer Requirements
        ↓
Skill Gap Engine
        ↓
Output: Skill Gaps with points
```

**Example Output:**
- LLM = 45 point gap
- Embeddings = 65 point gap
- RAG = 75 point gap

Then prerequisites are respected to produce the first real personalized learning sequence.
