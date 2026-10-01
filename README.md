# PathFinder

AI-Powered Personalized Learning Path Recommender

## 🟢 COMMIT 5 — Phase 4 Complete (2026-10-01, `7d253d5`)

**Status**: All Phase 4 committed ✅ — `feat: add Phase 4 roadmap + progress tracking system (4A-4E)`

**Endpoints**:
- `POST /api/profile/create` — Validate & store learner profile
- `POST /api/profile/extract` — Natural language → `LearnerProfile` via Gemini
- `POST /api/path/generate` — Returns `skill_gaps`, `recommendations`, `learning_path`, `roadmap` (optional `target_career`, `hours_per_week`, `learner_level`, `learning_preference`, `max_hours`, `resource_limit` — backward compatible; `roadmap` includes `estimated_weeks`)
- `POST /api/progress/activity` — Record learner activity
- `POST /api/progress/complete` — Mark resource as completed (+10 mastery heuristic, idempotent)
- `GET /api/progress/{learner_id}` — Get overall progress and next action
- `GET /api/progress/{learner_id}/skills` — Get skill mastery levels
- `GET /api/progress/dashboard/{learner_id}` — Unified dashboard (progress bar, skills, milestones, next action, real-hours `estimated_time_remaining`)
- `GET /api/progress/notifications/{learner_id}` — Personalized notifications (next action, milestones, streaks)
- `GET /api/progress/certificate/{learner_id}` — Completion certificate (100% only, SHA-256 verified)

**Verified 2026-10-01 (Commit 5)**: KB integrity PASS (77 skills, 5 careers, 70 career-skills, 65 prerequisites, 8 resources — 0 missing refs). 8-endpoint smoke PASS via `TestClient`, including `data_scientist` → `Data Scientist` roadmap label check + old-client backward-compat check. Next: Assessment Engine.

---

## 🟢 PHASE 4E — Notifications & Certificate Complete (2026-09-13, committed in Commit 5)

**Status**: All Phase 4 Complete ✅ — Committed in Commit 5 (`7d253d5`, 2026-10-01)

**Endpoints**:
- `POST /api/profile/create` — Validate & store learner profile
- `POST /api/profile/extract` — Natural language → `LearnerProfile` via Gemini
- `POST /api/path/generate` — **UPDATED** Returns `skill_gaps`, `recommendations`, `learning_path`, `roadmap`
- `POST /api/progress/activity` — Record learner activity
- `POST /api/progress/complete` — Mark resource as completed
- `GET /api/progress/{learner_id}` — Get overall progress and next action
- `GET /api/progress/{learner_id}/skills` — Get skill mastery levels
- `GET /api/progress/dashboard/{learner_id}` — Unified dashboard (progress bar, skills, milestones, next action)
- `GET /api/progress/notifications/{learner_id}` — **NEW** Personalized notifications (next action, milestones, streaks)
- `GET /api/progress/certificate/{learner_id}` — **NEW** Completion certificate (100% only, SHA-256 verified)

**Verified 2026-09-13 (Phase 4E, committed 2026-10-01 in `7d253d5`)**: Notifications and certificate endpoints complete. All Phase 4 components (4A-4E) committed. See COMMIT 5 section above for post-commit verification.

---

## 🟢 PHASE 4D — Dashboard Complete (2026-09-13)

**Status**: Skill Gap + Path + AI Profiling + Resource Matcher + **Roadmap** ✅ + **Progress Data** ✅ + **Progress API** ✅ + **Dashboard** ✅

**Endpoints**:
- `POST /api/profile/create` — Validate & store learner profile
- `POST /api/profile/extract` — Natural language → `LearnerProfile` via Gemini
- `POST /api/path/generate` — **UPDATED** Returns `skill_gaps`, `recommendations`, `learning_path`, `roadmap`
- `POST /api/progress/activity` — Record learner activity
- `POST /api/progress/complete` — Mark resource as completed
- `GET /api/progress/{learner_id}` — Get overall progress and next action
- `GET /api/progress/{learner_id}/skills` — Get skill mastery levels
- `GET /api/progress/dashboard/{learner_id}` — **NEW** Unified dashboard (progress bar, skills, milestones, next action)

**Verified 2026-09-13 (Phase 4D)**: Dashboard endpoint aggregates all progress data into a single `DashboardResponse` with visual progress bar, skill mastery bars, milestone history, and determined next action. All endpoints compile on Python 3.13.

---

## 🟢 PHASE 4C — Progress API Complete (2026-09-13)

**Status**: Skill Gap + Path + AI Profiling (77 skills, 5 careers) + Resource Matcher + **Roadmap Generator** ✅ + **Progress Data Model** ✅ + **Progress API** ✅

**Endpoints**:
- `POST /api/profile/create` — Validate & store learner profile
- `POST /api/profile/extract` — Natural language → `LearnerProfile` via Gemini
- `POST /api/path/generate` — **UPDATED** Returns `skill_gaps`, `recommendations`, `learning_path`, `roadmap`
- `POST /api/progress/activity` — **NEW** Record learner activity
- `POST /api/progress/complete` — **NEW** Mark resource as completed
- `GET /api/progress/{learner_id}` — **NEW** Get overall progress and next action
- `GET /api/progress/{learner_id}/skills` — **NEW** Get skill mastery levels

**Verified 2026-09-13 (Phase 4C)**: Progress API exposes four endpoints with Pydantic schemas and SQLAlchemy ORM. All endpoints compile on Python 3.13 and integrate with existing models (Activity, Progress, MasteryHistory).

---

## 🟢 PHASE 4B — Progress Data Model Complete (2026-09-13)

**Status**: Skill Gap + Path + AI Profiling (77 skills, 5 careers) + Resource Matcher + **Roadmap Generator** ✅ + **Progress Data Model** ✅

**Endpoints**:
- `POST /api/profile/create` — Validate & store learner profile
- `POST /api/profile/extract` — Natural language → `LearnerProfile` via Gemini
- `POST /api/path/generate` — **UPDATED** Returns `skill_gaps`, `recommendations`, `learning_path`, `roadmap`
- `POST /api/progress/activity` — Record learner activity [IMPLEMENTED]
- `POST /api/progress/complete` — Mark resource as completed [IMPLEMENTED]
- `GET /api/progress/{learner_id}` — Get overall progress [IMPLEMENTED]
- `GET /api/progress/{learner_id}/skills` — Get skill mastery levels [IMPLEMENTED]

**Verified 2026-09-13 (Phase 4B)**: Progress data model implements three core tables: `Activity` (append-only event log), `Progress` (mutable state snapshot), `MasteryHistory` (longitudinal skill evolution). All models compile on Python 3.13 and register with `Base.metadata.create_all()`.

---

## 🟢 PHASE 4A — Roadmap Generator Complete (committed in Commit 5, 2026-10-01)

**Status**: Skill Gap + Path + AI Profiling (77 skills, 5 careers) + Resource Matcher + **Roadmap Generator** ✅

**Endpoints**:
- `POST /api/profile/create` — Validate & store learner profile
- `POST /api/profile/extract` — Natural language → `LearnerProfile` via Gemini
- `POST /api/path/generate` — **UPDATED** Returns `skill_gaps`, `recommendations`, `learning_path`, `roadmap`

**Verified 2026-09-13 (Phase 4A)**: Roadmap generator transforms linear topological paths into 3-skill phases with explicit competence milestones and immediate `next_action`.

---

## 🟢 COMMIT 4 — Resource Recommendation Engine Ready

---

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
- activities (Phase 4B — append-only event log)
- progress (Phase 4B — mutable state snapshot)
- mastery_history (Phase 4B — longitudinal mastery)

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
- `POST /api/profile/extract` - Natural language → LearnerProfile via Gemini (Phase 2B, Commit 3)
- `POST /api/path/generate` - Skill gaps → recommendations → learning path + `resources[]` + `roadmap` (optional `target_career`, `hours_per_week`, `learner_level`, `learning_preference`, `max_hours`, `resource_limit` — Commit 5)
- `POST /api/progress/activity` - Record learner activity (Commit 5)
- `POST /api/progress/complete` - Mark resource completed, idempotent (Commit 5)
- `GET /api/progress/{learner_id}` - Overall progress + next action (Commit 5)
- `GET /api/progress/{learner_id}/skills` - Skill mastery levels (Commit 5)
- `GET /api/progress/dashboard/{learner_id}` - Unified dashboard (Commit 5)
- `GET /api/progress/notifications/{learner_id}` - Notifications (Commit 5)
- `GET /api/progress/certificate/{learner_id}` - Certificate at 100% (Commit 5)
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
│   ├── models/         # learner/skill/learner_skill/career/career_skill/prerequisite + activity/progress/mastery_history (Commit 5)
│   ├── schemas/        # profile.py, resource.py, roadmap.py (+estimated_weeks), progress.py (Commit 5)
│   ├── services/
│   │   ├── ai/          # llm_service.py — Gemini profile extraction (prompt → JSON → filter → Pydantic)
│   │   ├── skills/      # skill_gap_service.py
│   │   ├── recommendation/
│   │   ├── resources/   # resource_matcher.py — 50/20/20/10 deterministic scoring (Commit 4)
│   │   ├── roadmap/     # roadmap_generator.py — phases/milestones/next_action (Commit 5)
│   │   └── path/
│   ├── api/routes/      # profile.py (/create + /extract), path.py (+target_career/hours_per_week), progress.py (7 endpoints)
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
│   ├── INTERVIEW_PREP_COMMIT3.md
│   ├── INTERVIEW_PREP_COMMIT4.md
│   └── INTERVIEW_PREP_COMMIT5.md  # roadmap/progress/dashboard Q&A (Commit 5)
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
✓ **Resource Recommendation (Commit 4)** — 8 curated resources, 50/20/20/10 matcher, `resources[]` per skill
✓ **Phase 4 Roadmap + Progress (Commit 5, `7d253d5`)** — 3-skill phases with milestones/`next_action`/`estimated_weeks`; Activity/Progress/MasteryHistory tables; 7 progress endpoints (activity, complete, progress, skills, dashboard, notifications, certificate)

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

## 🔮 What Comes After Commit 5

The full PathFinder application is built in layers:

```
               USER
                 ↓
     Natural language goal
                 ↓
   AI Goal Understanding (LLM)       ← Commit 3 (Gemini extract) ✅
                 ↓
     Learner Profile ✅              ← Phase 2A — DONE
                 ↓
   Skill Gap Engine ✅ (Commit 2)
                 ↓
Recommendation Engine ✅ (Commit 2)
                 ↓
   Personalized Path ✅ (Commit 2)
                 ↓
   Resources + Projects ✅          ← Commit 4
                 ↓
   Roadmap + Progress + Dashboard ✅ ← Commit 5 (`7d253d5`)
                 ↓
   Assessment Engine                 ← NEXT (Phase 5)
                 ↓
   Real Mastery Updates → Adaptive Roadmap
                 ↓
    AI Assistant (LLM)
```

**Current State**: Layers 1-9 are complete (Natural Language → Learner Profile (AI) → Skill Gap → Recommendation → Path → Resources → Roadmap → Progress → Dashboard/Certificate)
**Next Step**: Phase 5 — Assessment Engine (quiz scoring → real mastery updates → adaptive roadmap), replacing the V1 `+10 per completion` heuristic
**Focus**: `POST /api/path/generate` + 7 progress endpoints verified 2026-10-01; next builds `services/assessment/` + `api/routes/assessment.py`

---

## 🧭 PathFinder Status So Far — Commit 5: Roadmap + Progress Platform (2026-10-01)

We have built the **core backend intelligence + learner profile bridge + canonical knowledge base + AI extraction + resources + roadmap + progress tracking**. Think of it like a car — engine, knowledge, driver intake, and now the **dashboard and trip computer** work; next is the **adaptive cruise control** (assessment → mastery → adaptation).

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
Learner (natural language) → LearnerProfile (Gemini extract) → Skill Gap Engine → Skill Gaps
   ▼
Recommendation Engine (prerequisites) → Learning Path Generator (+resources) → Roadmap Generator (phases/milestones/next_action)
   ▼
Activity/Complete → Progress + MasteryHistory → Dashboard / Notifications / Certificate
```

### What We Have Built

**✅ FastAPI Backend** — `backend/app/main.py` is the communication layer (future: `React → FastAPI → PathFinder`)

**✅ Database Foundation** — SQLite + SQLAlchemy (`pathfinder.db`) with 9 models:
`Learner`, `Skill`, `LearnerSkill`, `Career`, `CareerSkill`, `Prerequisite` + `Activity`, `Progress`, `MasteryHistory` (Commit 5)
→ Learner has Skills, Career requires Skills, Skill depends on Prerequisites, Activity logs events, Progress snapshots state, MasteryHistory tracks skill evolution

**✅ Knowledge Base (77 canonical skills)** across 10 domains: Programming, Mathematics, ML, Deep Learning, GenAI, Retrieval, RAG, Agents, Backend, Deployment, Career.
Chain: `Python → ML → Transformers → LLM Fundamentals → Embeddings → Vector DB → RAG → AI Agents`

**✅ Career Knowledge** — 5 careers (GenAI Engineer deepest): Python, ML, Transformers, LLM Fundamentals, Prompt Eng, Embeddings, Vector DB, RAG, AI Agents, FastAPI, Docker, Cloud, System Design, Capstone

**✅ Prerequisite Graph** (directed edges, hard/soft):
`LLM Fundamentals → Embeddings → Vector DB → Vector Search → Retrieval → RAG`
→ PathFinder can say: *“You want RAG but you’re not ready — build Embeddings first.”*

**✅ Skill Gap Engine** — compares `WHAT YOU KNOW vs WHAT CAREER REQUIRES`
e.g. Python 80/70 → READY, RAG 0/75 → GAP = 75

**✅ Recommendation Engine** — ranks by `priority = gap × importance_weight`
e.g. RAG gap 75/critical → High, Docker gap 30/medium → Lower

**✅ Prerequisite Awareness** — RAG 0 + Embeddings 0 → recommends `Embeddings → Vector DB → Vector Search → Retrieval → RAG` instead of jumping to RAG

**✅ Learning Path Generator** — ordered `Step 1 → Step 2...` with `skill, current/target/gap, importance, readiness, reason`
e.g. `Step 4: RAG | 0/75 | Critical | Why: prerequisite retrieval skills must be developed first`

**✅ Learner Profile (Phase 2A)** — `LearnerProfile` Pydantic schema + `POST /api/profile/create`
→ `hours_per_week` → float, `mastery` 0..100; `hours="a lot"` → 422. See `Phase_2A_Learner_Profile.md`.

**✅ Current APIs** — profile + path + progress end-to-end (Commit 5):
`Request → /api/profile/extract (AI) → /api/path/generate → gaps + recommendations + learning_path (+resources) + roadmap → /api/progress/activity → /complete → /progress/{id} → /dashboard/{id} → /notifications → /certificate`

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

- Real assessment scoring (current: V1 `+10 mastery per completion` heuristic) — Phase 5
- Adaptive roadmap recalculation (mastery → gap → path change) — Phase 6
- AI explanations / AI tutor (Gemini/Groq) — Phase 7
- Frontend (React) — Phase 8

> Status: **Commit 5 `7d253d5` (2026-10-01)** — roadmap + progress platform, real foundation + dashboard.

### 🚀 NEXT: Phase 5 — Assessment Engine

Commit 5 finished the **recommendation + tracking product** (`Profile → Gaps → Path → Resources → Roadmap → Progress → Dashboard → Certificate`).

Phase 5 makes it **truly adaptive**:

```
Learn → Assessment → Score → Mastery update → Gaps recalculated → Roadmap adapts → AI explains
```

User says: *“I’m a 3rd year student. I know Python and basic ML. I want GenAI Engineer in 6 months, 10 hrs/week, project-based.”*
→ Gemini → `LearnerProfile{target_career:"genai_engineer", experience_level:"intermediate", skills:[{skill_id:"python",mastery:70},{skill_id:"ml",mastery:50}], hours_per_week:10, deadline:"6 months", learning_preference:"project"}`
→ gaps → path → roadmap (`estimated_weeks` from `hours_per_week`) → progress → dashboard.
Phase 5 Architecture:
```
                  USER
                    │ Assessment answers
                    ▼
           ┌──────────────────┐
           │ Assessment Engine│ ← Phase 5 (scoring + mastery update)
           └────────┬─────────┘
                    ▼
           MasteryHistory (source=quiz)
                    │
                    ▼
           Skill Gap Engine → Recommendation Engine → Roadmap (adapted)
```

### 🟢 Git Status

```
Commit 1  feat: initialize PathFinder foundation
Commit 2  feat: implement skill gap and learning path engine
Commit 3  feat: add canonical skill catalog and AI-powered learner profiling
Commit 4  feat: add personalized resource recommendation engine
Commit 5  feat: add Phase 4 roadmap + progress tracking system (4A-4E) ← YOU ARE HERE (`7d253d5`, 2026-10-01)
```
**Commit 5 pushed** — Phase 4 verified 2026-10-01. Next: **Phase 5 — Assessment Engine.**
