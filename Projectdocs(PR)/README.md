# PathFinder

AI-Powered Personalized Learning Path Recommender

## 🟢 COMMIT 4 — Resource Recommendation Engine Ready

**Status**: Skill Gap + Path + AI Profiling (77 skills, 5 careers) + Resource Matcher (8 curated resources, 50/20/20/10 scoring) ✅ Complete

**Endpoints**:
- `POST /api/profile/create` — Validate & store learner profile (Pydantic: mastery 0..100, `hours_per_week` float)
- `POST /api/profile/extract` — Natural language → `LearnerProfile` via Gemini (canonical catalog, 3-layer validation)
- `POST /api/path/generate` — **UPDATED** Skill gaps → recommendations → learning path with `resources[]` per skill (optional `learner_level`, `learning_preference`, `max_hours`, `resource_limit` — backward compatible)

**Verified 2026-09-12 (Commit 4)**: `load_resources()=8`, `missing=[]`, Pydantic `validated=8`; matcher `embeddings/beginner/project → project 90.0 > course 80.0`; `POST /api/path/generate → 200` with `embeddings → 2 resources`. Earlier: `POST /api/profile/extract` all 200 (GenAI/DataSci/Backend/Sparse); `POST /api/profile/create` rejects `hours="a lot"` (422), `mastery=150` (422). `pytest` not installed — smoke via `TestClient`.

**Ready to commit (Commit 4)**:
```bash
git add .
git commit -m "feat: add personalized resource recommendation engine"
git push
```

---

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

### Phase 1D - Intelligence Services (Added)

- **Skill Gap Engine**: Calculates gaps between learner mastery and career requirements with priority scoring
  - Formula: `gap = required mastery - current mastery`
  - Priority: `priority = gap × importance weight`
  - Importance weights: critical=1.0, high=0.85, medium=0.65, low=0.40

- **Recommendation Engine**: Provides personalized skill recommendations considering prerequisites
  - Takes skill gaps and prerequisite chains into account
  - Sequences skills based on dependencies

- **Learning Path Generator**: Creates personalized learning roadmaps
  - Respects prerequisite dependencies
  - Organizes path into phases based on dependency levels
  - Outputs sequential learning path with status (ready/blocked)

### STEP 10: Test it ✅ (Commit 2)

API endpoint verified at `http://127.0.0.1:8000`:

- **Endpoint**: `POST /api/path/generate`
- **Response contains**: `skill_gaps`, `recommendations`, `learning_path`
- **Test request** includes `current_skills`, `career_requirements`, `prerequisites`

### Phase 2A: Learner Profile ✅ (Commit 2A)

**Goal:** Convert what the learner tells PathFinder into structured data for the engine.

```
Natural language
       ↓
AI understands it   ← Phase 2B (Gemini/Groq)
       ↓
LearnerProfile (Pydantic) ← Phase 2A — DONE
       ↓
Skill Gap Engine → Recommendation → Path
```

**What it contains** (hackathon: needs/interests/patterns/goals):
```
Learner Profile: name?, target_career*, experience_level*, skills[{skill_id, mastery 0..100}],
  completed_courses[], completed_projects[], interests[], hours_per_week?, deadline?, learning_preference?
```

**Design:** No 15-question form. One prompt — *"Tell me about your goal, experience, skills, and how you prefer to learn."* — LLM extracts (Phase 2B) into `LearnerProfile`. See `Phase_2A_Learner_Profile.md`.

**Files:** `backend/app/schemas/profile.py` (Pydantic), `backend/app/api/routes/profile.py` (`POST /api/profile/create`), wired in `backend/app/main.py` (`app.include_router(profile_router)`).

**Validation:** `hours_per_week` → float, `mastery` → 0..100; `hours="a lot"` → 422, `mastery=150` → 422. Verified 2026-09-01 with `TestClient`.

### 🚨 Important Architectural Point

The core PathFinder implementation follows a **hybrid architecture**:

```
Deterministic Algorithm
       +
Knowledge Graph
       +
Learner Data
       +
LLM
```

not:

```
Everything → LLM → hope it gives the right answer
```

**Why this matters**:

- **Deterministic algorithm** handles: skill gaps, prerequisite checking, priority scoring, sequencing, progress tracking
- **Knowledge graph** maps prerequisite relationships (e.g., Embeddings → Vector Database → Vector Search → Retrieval → RAG)
- **Learner data** provides current mastery levels against career requirements
- **LLM** is reserved for: natural language goal understanding, profile extraction, conversational assistant, explanation generation

This modular design ensures:
- Reliable, predictable results from the core algorithm
- Easy explanation to judges what each component handles
- Future enhancement path: LLM can be added for NL understanding without breaking core logic
- Clear separation of concerns: algorithm handles the "what", LLM handles the "how" in natural language

### API Endpoints

- `POST /api/profile/create` - Create/validate learner profile (Phase 2A)
- `POST /api/profile/extract` - **NEW** Natural language → LearnerProfile via Gemini (Phase 2B, Commit 3)
- `POST /api/path/generate` - Generate complete learning path from current skills and career goals
- `GET /` , `GET /health` - Health

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
│   ├── schemas/         # profile.py — LearnerProfile (Field default_factory, Optional experience_level)
│   ├── services/
│   │   ├── ai/          # llm_service.py — Gemini profile extraction (prompt → JSON → filter → Pydantic)
│   │   ├── skills/      # skill_gap_service.py
│   │   ├── recommendation/
│   │   └── path/
│   ├── api/routes/      # profile.py (/create + /extract), path.py
│   └── data_loader.py   # canonical catalog loader (skills_catalog.json priority)
├── data/
│   ├── skills_catalog.json   # NEW — 77 canonical skills (single source of truth)
│   ├── skills.json           # prerequisite edges (legacy, fallback)
│   ├── prerequisites.json    # 65 edges (hard/soft) — now includes data/backend: pandas→python, databases→sql...
│   ├── careers.json          # 5 careers
│   ├── career_skills.json    # 70 rows — all 5 careers mapped (genai 26, ai 10, ml 11, data_sci 12, backend 11)
│   ├── resources.json
│   ├── projects.json
│   └── assessments/
├── docs/
│   └── INTERVIEW_PREP_COMMIT3.md  # 32 Q&A for this commit
└── requirements.txt      # + google-genai, python-dotenv
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

## Knowledge Base Files (Commit 3 — Canonical)

- `data/skills_catalog.json` — **NEW, canonical** — 77 skills (Programming 5, Data 6, Math 4, ML 6, Deep Learning 8, GenAI 19, Engineering 8, Backend 7, Deployment 6). Single source of truth; every `career_skills.skill_id` and `prerequisites.*` must exist here. `load_skills()` prefers this file.
- `data/careers.json` — 5 careers: `genai_engineer`, `ai_engineer`, `ml_engineer`, `data_scientist`, `backend_developer`
- `data/career_skills.json` — 70 rows, all 5 careers mapped: GenAI 26, AI 10, ML 11, DataSci 12, Backend 11 (`required_mastery` + `importance` critical/high/medium)
- `data/prerequisites.json` — 65 directed edges (`hard`/`soft`): `pandas→python`, `databases→sql`, `scikit_learn→python/ml` added for Data/Backend completeness
- `data/skills.json` — legacy prerequisite edges (fallback if catalog missing)

## Validate JSON Files

From `backend/` directory:
```bash
python -m json.tool data/skills.json > nul
python -m json.tool data/prerequisites.json > nul
python -m json.tool data/careers.json > nul
python -m json.tool data/career_skills.json > nul
python -m json.tool data/skills_catalog.json > nul
```
No output = valid JSON.

## GitHub Commit Summary

✓ FastAPI foundation
✓ SQLite database foundation
✓ Core database models (6 tables)
✓ **Canonical skill catalog (77 skills, single source of truth)** — `data/skills_catalog.json`
✓ Career knowledge base (5 careers, all mapped — 70 rows)
✓ Prerequisite graph (65 edges, hard/soft) — now covers Data/Backend
✓ GenAI/AI/ML/DataSci/Backend skill requirements with mastery + importance
✓ **AI Learner Profiling (Gemini)** — `POST /api/profile/extract` with 3-layer validation (prompt → filter → Pydantic)

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

---

## 🔮 What Comes After Commit 3

The full PathFinder application will be built in layers:

```
              USER
                ↓
    Natural language goal
                ↓
  AI Goal Understanding (LLM)       ← Phase 2B (Gemini/Groq) — next
                ↓
    Learner Profile ✅              ← Phase 2A — DONE (schema + POST /api/profile/create)
                ↓
  Skill Gap Engine ✅ (Commit 2)
                ↓
Recommendation Engine ✅ (Commit 2)
                ↓
  Personalized Path ✅ (Commit 2)
                ↓
  Resources + Projects              ← Phase 3
                ↓
  Progress Tracking
                ↓
  Adaptive Updates
                ↓
   AI Assistant (LLM)
```

**Current State**: Layers 1-6 are complete (Natural Language → Learner Profile (AI) → Skill Gap → Recommendation → Path)
**Next Step**: Phase 3 — Resource Recommendation Engine (Skill → courses/projects) + Skill Gap → Path wiring for extracted profiles of LearnerProfile from natural language
**Focus**: `POST /api/profile/create` is ready; next wires `"I want GenAI in 6 months, 10hrs/week"` → `LearnerProfile`

---

## 🧭 PathFinder Status So Far — Core Engine v0.3 (Phase 2A Complete)

We have built the **core backend intelligence foundation + learner profile bridge + canonical knowledge base + AI extraction**. Think of it like a car — we built the **engine, knowledge, and driver intake**, not yet the conversational body.

```
                 PATHFINDER
                     │
        ┌────────────┴────────────┐
        │                         │
    Knowledge                  Intelligence
       Base                      Engine
        │                         │
        ▼                         ▼
 Skills + Careers          Gap Calculation
 Prerequisites             Recommendations
                           Path Generation
```

### Current Pipeline

```
Learner (natural language) → LearnerProfile (Phase 2A) → Skill Gap Engine → Compare vs Target Career → Skill Gaps
   ▼
Recommendation Engine → Check prerequisites → Recommended Skills
   ▼
Learning Path Generator → Ordered Learning Path
```

### What We Have Built

**✅ FastAPI Backend** — `backend/app/main.py` is the communication layer (future: `React → FastAPI → PathFinder`)

**✅ Database Foundation** — SQLite + SQLAlchemy (`pathfinder.db`) with 6 models:
`Learner`, `Skill`, `LearnerSkill`, `Career`, `CareerSkill`, `Prerequisite`
→ Learner has Skills, Career requires Skills, Skill depends on Prerequisites

**✅ Knowledge Base (~50 skills)** across 10 domains: Programming, Mathematics, ML, Deep Learning, GenAI, Retrieval, RAG, Agents, Backend, Deployment, Career.
Chain: `Python → ML → Transformers → LLM Fundamentals → Embeddings → Vector DB → RAG → AI Agents`

**✅ Career Knowledge** — 5 careers (GenAI Engineer deepest): Python, ML, Transformers, LLM Fundamentals, Prompt Eng, Embeddings, Vector DB, RAG, AI Agents, FastAPI, Docker, Cloud, System Design, Capstone

**✅ Prerequisite Graph** (directed edges, hard/soft):
`LLM Fundamentals → Embeddings → Vector DB → Vector Search → Retrieval → RAG`
→ PathFinder can say: *"You want RAG but you're not ready — build Embeddings first."*

**✅ Skill Gap Engine** — compares `WHAT YOU KNOW vs WHAT CAREER REQUIRES`
e.g. Python 80/70 → READY, RAG 0/75 → GAP = 75

**✅ Recommendation Engine** — ranks by `priority = gap × importance_weight`
e.g. RAG gap 75/critical → High, Docker gap 30/medium → Lower

**✅ Prerequisite Awareness** — RAG 0 + Embeddings 0 → recommends `Embeddings → Vector DB → Vector Search → Retrieval → RAG` instead of jumping to RAG

**✅ Learning Path Generator** — ordered `Step 1 → Step 2...` with `skill, current/target/gap, importance, readiness, reason`
e.g. `Step 4: RAG | 0/75 | Critical | Why: prerequisite retrieval skills must be developed first`

**✅ Learner Profile (Phase 2A)** — `LearnerProfile` Pydantic schema + `POST /api/profile/create`
→ `hours_per_week` → float, `mastery` 0..100; `hours="a lot"` → 422. See `Phase_2A_Learner_Profile.md`.

**✅ Current APIs** — `POST /api/profile/create` + `POST /api/path/generate` end-to-end:
`Request → /api/profile/create (validate) → /api/path/generate → Skill Gap Engine → Recommendation Engine → Path Generator → JSON (profile + skill_gaps + recommendations + learning_path)`

### Architecture Visual

```
                    PATHFINDER
                         │
                         ▼
                 ┌───────────────┐
                 │ Knowledge Base │
                 └───────┬───────┘
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Skills      Careers   Prerequisites
             │           │           │
             └───────────┼───────────┘
                         ▼
                 ┌───────────────┐
                 │ Skill Gap     │
                 │ Engine        │
                 └───────┬───────┘
                         ▼
                 ┌───────────────┐
                 │ Recommendation│
                 │ Engine        │
                 └───────┬───────┘
                         ▼
                 ┌───────────────┐
                 │ Path Generator│
                 └───────┬───────┘
                         ▼
                  Learning Path
```

### ❌ What We Have NOT Built Yet

- Conversational interface / LLM extraction (`"I want to become GenAI Engineer in 6 months" → LearnerProfile`) — Phase 2B
- Resource recommendations (Skill → courses/projects/videos/articles/assessments)
- Dashboard (progress, milestones, next action)
- AI assistant (Gemini/Groq — Phase 2B)
- Adaptation loop (complete task → assessment → new mastery → recalculate → update path)
- Frontend (React)

> Status: **PathFinder Core Engine v0.3 (Phase 2A)** — profile bridge + engine, real foundation.

### 🚀 NEXT: Phase 2B — Natural Language → LearnerProfile (LLM)

Phase 2A built the **container** (`LearnerProfile` + `POST /api/profile/create`). Phase 2B adds **extraction**:

User says: *"I'm a 3rd year student. I know Python and basic ML. I want GenAI Engineer in 6 months, 10 hrs/week, project-based."*
→ Gemini/Groq → `LearnerProfile{target_career:"GenAI Engineer", experience_level:"intermediate", skills:[{skill_id:"python",mastery:70},{skill_id:"machine_learning",mastery:50}], hours_per_week:10, deadline:"6 months", learning_preference:"project"}`

Phase 2B Architecture:
```
                 USER
                   │ Natural language
                   ▼
          ┌──────────────────┐
          │ Goal Understanding│ ← Phase 2B (Gemini/Groq)
          └────────┬─────────┘
                   ▼
          ┌──────────────────┐
          │ Profile Extractor│ ← Maps to LearnerProfile schema
          └────────┬─────────┘
                   ▼
            Learner Profile ✅ ← Phase 2A DONE
                   │
                   ▼
          Skill Gap Engine → Recommendation Engine → Learning Path
```

### 🟢 Git Status

```
Commit 1  feat: initialize PathFinder foundation
Commit 2  feat: implement skill gap and learning path engine
Commit 3  feat: add canonical skill catalog and AI-powered learner profiling ← YOU ARE HERE (Commit 3)
```
**Ready to push Commit 3** — Phase 2A verified 2026-09-01. Next: **Phase 2B — Natural Language → LearnerProfile (Gemini/Groq).** Reply `go` to build it.