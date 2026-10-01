# Steps Done - PathFinder Backend Foundation

## 🟢 PHASE 4A — Roadmap Generator — DONE (2026-09-13)

**Where we are:**
```text
Commit 1 Foundation ✅
   ↓
Commit 2 Skill Gap + Learning Path Engine ✅
   ↓
Commit 3 AI Learner Profiling ✅
   ↓
Commit 4 Resource Recommendation Engine ✅
   ↓
PHASE 4A Roadmap Generator ✅ ← COMPLETED
   ↓
PHASE 4B Progress Data Model ✅ ← COMPLETED
   ↓
PHASE 4C Progress API ✅ ← COMPLETED
   ↓
PHASE 4D Dashboard ✅ ← COMPLETED
   ↓
PHASE 4E Notifications & Certificate ✅ ← COMPLETED
   ↓
COMMIT 5 ✅ ← READY TO COMMIT
```

**Complete Pipeline:**
- Phase 3: Skill Gap → Recommendation → Learning Path → Resource Matching
- Phase 4A: Learning Path → Roadmap (Phases, Milestones, Time Estimation, Next Action)
- Phase 4B: Progress Data Model (Activity, Progress, MasteryHistory tables)
- Phase 4C: Progress API (activity, complete, progress, skills, dashboard, notifications, certificate)
- Phase 4D: Dashboard API (visual progress bar, skill mastery, milestones, next action)
- Phase 4E: Notifications & Certificate (encouragement, completion verification)

**All Phase 4 components implemented and compiling on Python 3.13. Ready for Commit 5.**

**Commit 5 personalization fixes (2026-10-01, verified):**
- `POST /api/path/generate` accepts optional `target_career` (canonical id or name, e.g. `data_scientist` → `Data Scientist`) + `hours_per_week`; defaults preserve old clients (`GenAI Engineer`, `10.0`).
- `Roadmap` adds optional `estimated_weeks` (`total_hours / hours_per_week`, guarded).
- Dashboard `estimated_time_remaining` sums real `estimated_hours` per remaining resource (fallback `1.0h` for ad-hoc ids).
- `target_mastery = 70.0` kept as documented V1 default (per-career lookup deferred to Assessment phase).
- Verified: KB integrity PASS (0 missing), 8-endpoint smoke PASS including DS-career label check + backward-compat check.

---

## 🟢 COMMIT 5 — Phase 4 Complete — READY TO COMMIT (2026-09-13)

**Problem solved:** Phase 3 gave us *"What should this learner learn, and from which resources?"* Phase 4A transforms the raw, flat topological sequence into a structured, human-centered **Roadmap** with digestible 3-skill phases, meaningful milestones (e.g., "AI Foundations Ready"), defensive time estimations, and an unambiguous immediate `next_action` card.

**Files (verified):**
- `backend/app/schemas/roadmap.py` — Pydantic models: `RoadmapResource`, `RoadmapSkill`, `Milestone`, `RoadmapPhase`, `Roadmap`.
- `backend/app/services/roadmap/roadmap_generator.py` — `generate_roadmap()`, `build_phase()`, `get_next_action()`. Fixed 3-skills-per-phase chunking for V1; defensive resource hour parsing.
- `backend/app/services/roadmap/__init__.py` — Clean export of `generate_roadmap`.
- `backend/app/api/routes/path.py` — Integrated roadmap generator directly into `POST /api/path/generate` response (`skill_gaps`, `recommendations`, `learning_path`, `roadmap`).
- `Phase 4.md` / `PHASE_4.md` — Complete documentation for Phase 4 architecture and all subphases (4A-4E).
- `Phase 4 Interview QA.md` — Technical and system design interview preparation with code examples and STAR behavioral answers.

**Verified (not invented):**
- Test with 3 skills (Python, ML, Embeddings) $\rightarrow$ 1 phase, total estimated hours = 63.0, next action = "Start learning python_fundamentals."
- Clean compilation on Python 3.13 across all modified files.

---

## 🟢 PHASE 4B — Progress Data Model — DONE (2026-09-13)

**Where we are:**
```text
PHASE 4A Roadmap Generator ✅ ← COMPLETED
   ↓
PHASE 4B Progress Data Model ✅ ← COMPLETED (2026-09-13)
   ↓
PHASE 4C Progress API ✅ ← COMPLETED (2026-09-13)
   ↓
PHASE 4D Dashboard (Upcoming)
   ↓
PHASE 4E Notifications & Certificate (Upcoming)
   ↓
COMMIT 5 (After Phase 4E)
```

**Problem solved:** Phase 4B implements the data layer for tracking what learners actually do. Three core relational tables (`Activity`, `Progress`, `MasteryHistory`) provide the foundation for progress visualization, adaptive learning, and milestone tracking.

**Files created:**
- `backend/app/models/activity.py` — `Activity` model with `learner_id`, `resource_id`, `activity_type`, `started_at`, `completed_at`. Append-only event log.
- `backend/app/models/progress.py` — `Progress` model with `learner_id`, `resource_id`, `status`, `progress_percent`, `completed_at`. Mutable current state snapshot.
- `backend/app/models/mastery_history.py` — `MasteryHistory` model with `learner_id`, `skill_id`, `mastery`, `recorded_at`, `source`. Longitudinal skill evolution tracking.
- `backend/app/models/__init__.py` — Updated to import all three new models alongside existing models (Learner, Skill, LearnerSkill, Career, CareerSkill, Prerequisite).
- `backend/app/main.py` — Updated to import `Activity`, `Progress`, `MasteryHistory` so `Base.metadata.create_all()` registers all tables on startup.

**Schema details:**
- **Activity** (`activities` table):
  - `id` (Integer, PK), `learner_id` (FK → learners.id), `resource_id` (String), `activity_type` (String), `started_at` (DateTime, default=func.now()), `completed_at` (DateTime, nullable)
  - Append-only event log for granular user telemetry (started, completed, practiced, quiz_attempt)
- **Progress** (`progress` table):
  - `id` (Integer, PK), `learner_id` (FK → learners.id), `resource_id` (String), `status` (String, default="not_started"), `progress_percent` (Float, default=0.0), `completed_at` (DateTime, nullable)
  - Mutable state snapshot for immediate UI rendering
- **MasteryHistory** (`mastery_history` table):
  - `id` (Integer, PK), `learner_id` (FK → learners.id), `skill_id` (FK → skills.id), `mastery` (Float), `recorded_at` (DateTime, default=func.now()), `source` (String)
  - Longitudinal time-series for adaptive learning (self_assessment, quiz, project, ai_estimate)

**Verified (not invented):**
- All three model files compile successfully on Python 3.13
- `app/models/__init__.py` updated with imports for Activity, Progress, MasteryHistory
- `app/main.py` updated to import all three new models for `Base.metadata.create_all()`
- `activity.py` uses `from sqlalchemy.sql import func` for `func.now()` default timestamps
- `progress.py` uses `from sqlalchemy.sql import func` for `func.now()` default timestamps
- `mastery_history.py` uses `from sqlalchemy.sql import func` for `func.now()` default timestamps
- Foreign key relationships correctly reference `learners.id`, `skills.id`

**Next Step:** Begin Phase 4C (Progress API endpoints) implementation.

---

## 🟢 PHASE 4C — Progress API — DONE (2026-09-13)

**Where we are:**
```text
PHASE 4A Roadmap Generator ✅ ← COMPLETED
   ↓
PHASE 4B Progress Data Model ✅ ← COMPLETED
   ↓
PHASE 4C Progress API ✅ ← YOU ARE HERE (Completed 2026-09-13)
   ↓
PHASE 4D Dashboard (Upcoming)
   ↓
PHASE 4E Notifications & Certificate (Upcoming)
   ↓
COMMIT 5 (After Phase 4E)
```

**Problem solved:** Phase 4C exposes the progress tracking functionality through REST API endpoints so the frontend can interact with the progress data model.

**Files created:**
- `backend/app/schemas/progress.py` — Pydantic schemas: `ActivityRequest`, `CompleteRequest`, `ProgressResponse`, `SkillMasteryResponse`, `LearnerProgressResponse`
- `backend/app/api/routes/progress.py` — FastAPI router with endpoints:
  - `POST /api/progress/activity` — Record learner activity
  - `POST /api/progress/complete` — Mark resource as completed
  - `GET /api/progress/{learner_id}` — Get overall progress and next action
  - `GET /api/progress/{learner_id}/skills` — Get skill mastery levels
- `backend/app/schemas/__init__.py` — Updated to export all progress schemas
- `backend/app/main.py` — Updated to import and include the progress router

**Endpoints:**

1. **`POST /api/progress/activity`** — Request body: `{learner_id: int, resource_id: str, activity_type: str}`
   - Creates an `Activity` record in the database
   - Returns: `{message, activity_id, activity_type, started_at}`

2. **`POST /api/progress/complete`** — Request body: `{learner_id: int, resource_id: str}`
   - Upserts `Progress` record (status=completed, progress_percent=100.0)
   - Creates `Activity` log entry
   - Returns: `{message, resource_id, progress_percent, status}`

3. **`GET /api/progress/{learner_id}`** — Returns: `LearnerProgressResponse`
   - Calculates `overall_progress` (percentage)
   - Counts total/completed/in-progress/not-started resources
   - Aggregates `milestones` from `MasteryHistory`
   - Determines `next_action` based on progress state

4. **`GET /api/progress/{learner_id}/skills`** — Returns: `List[SkillMasteryResponse]`
   - Retrieves latest mastery per skill from `MasteryHistory`
   - Calculates gap = target_mastery - current_mastery
   - Determines status (ready/in_progress)

**Architecture:**
```
Frontend
    │
    ├── POST /api/progress/activity ──► Activity model
    ├── POST /api/progress/complete ──► Progress + Activity models
    ├── GET /api/progress/{learner_id} ──► Progress + MasteryHistory models
    └── GET /api/progress/{learner_id}/skills ──► MasteryHistory + Skill models
```

**Verified (not invented):**
- All Phase 4C files compile successfully on Python 3.13
- `progress.py` schemas use Pydantic `BaseModel` with proper type annotations
- `progress.py` router uses FastAPI `Depends(get_db)` for database session injection
- `progress.py` router uses `response_model` for type-safe responses
- `main.py` imports and includes `progress_router` with prefix `/api/progress`
- `schemas/__init__.py` exports all new schemas

**Next Step:** Begin Phase 4D (Dashboard visualization components).

---

## 🟢 PHASE 4D — Dashboard — DONE (2026-09-13)

**Where we are:**
```text
PHASE 4A Roadmap Generator ✅ ← COMPLETED
   ↓
PHASE 4B Progress Data Model ✅ ← COMPLETED
   ↓
PHASE 4C Progress API ✅ ← COMPLETED
   ↓
PHASE 4D Dashboard ✅ ← YOU ARE HERE (Completed 2026-09-13)
   ↓
PHASE 4E Notifications & Certificate (Upcoming)
   ↓
COMMIT 5 (After Phase 4E)
```

**Problem solved:** Phase 4D provides a unified dashboard view that aggregates all progress data into a single, cohesive response for the frontend to render. The dashboard focuses on four key widgets: Overall Progress, Skill Mastery, Milestones, and Next Action.

**Files updated:**
- `backend/app/schemas/progress.py` — Added `DashboardResponse` schema with progress bar visualization
- `backend/app/api/routes/progress.py` — Added `GET /api/dashboard/{learner_id}` endpoint

**Dashboard Endpoint:** `GET /api/dashboard/{learner_id}`
- Returns `DashboardResponse` with:
  - `overall_progress` (float percentage)
  - `progress_bar` (string visualization like "██████░░░░ 68%")
  - `total_resources`, `completed_resources`, `in_progress_resources`, `not_started_resources`
  - `skill_mastery` (list of `SkillMasteryResponse`)
  - `milestones` (from MasteryHistory)
  - `next_action` (determined from progress state)
  - `estimated_time_remaining` (calculated from remaining resources)

**Four Dashboard Widgets:**
1. **Overall Progress Bar** — Visual bar with percentage (e.g., "██████░░░░ 68%")
2. **Skill Mastery** — List of skills with current vs target mastery
3. **Milestones** — Aggregated from MasteryHistory with timestamps
4. **Next Action** — Determined dynamically based on progress state

**Verified (not invented):**
- All Phase 4D files compile successfully on Python 3.13
- `DashboardResponse` schema uses Pydantic `BaseModel` with proper type annotations
- Dashboard endpoint uses `response_model=DashboardResponse` for type-safe responses
- Progress bar visualization correctly renders filled/empty blocks
- Next action logic handles all cases (not_started, in_progress, all completed)
- `estimated_time_remaining` calculated from remaining resources

**Next Step:** Begin Phase 4E (Notifications & Certificate system).

---

## 🟢 PHASE 4E — Notifications & Certificate — DONE (2026-09-13)

**Where we are:**
```text
PHASE 4A Roadmap Generator ✅ ← COMPLETED
   ↓
PHASE 4B Progress Data Model ✅ ← COMPLETED
   ↓
PHASE 4C Progress API ✅ ← COMPLETED
   ↓
PHASE 4D Dashboard ✅ ← COMPLETED
   ↓
PHASE 4E Notifications & Certificate ✅ ← YOU ARE HERE (Completed 2026-09-13)
   ↓
COMMIT 5 (Ready to commit)
```

**Problem solved:** Phase 4E provides encouragement throughout the learning journey and recognizes completion with a verifiable certificate.

**Endpoints added:**
- `GET /api/progress/notifications/{learner_id}` — Returns personalized notifications (next action, milestones, streaks)
- `GET /api/progress/certificate/{learner_id}` — Returns completion certificate if 100% complete

**Notifications Types:**
1. **next_action** — Highlights remaining resources to complete
2. **milestone** — Celebrates when completing every 3 resources
3. **streak** — Encourages continued progress for in-progress resources

**Certificate:**
- Generated SHA-256 hash certificate ID
- Only available when `completion_percent == 100.0`
- Returns `CertificateResponse` with learner name, career, skills, date, certificate ID, and verified status
- Returns 403 if completion < 100%
- Returns 404 if no progress records found

**Files updated:**
- `backend/app/schemas/progress.py` — Added `NotificationResponse`, `CertificateResponse` schemas
- `backend/app/api/routes/progress.py` — Added `GET /api/progress/notifications/{learner_id}` and `GET /api/progress/certificate/{learner_id}` endpoints

**Verified (not invented):**
- All Phase 4E files compile successfully on Python 3.13
- `NotificationResponse` and `CertificateResponse` use Pydantic `BaseModel` with proper type annotations
- Notification generation correctly identifies next action, milestones, and streaks
- Certificate endpoint correctly checks for 100% completion before granting
- Certificate ID generated using SHA-256 hash for uniqueness and verification
- Proper HTTP error handling (403 for incomplete, 404 for no records)

**Next Step:** Commit 5 — Final integration after all Phase 4 components complete.

---

## 🟢 COMMIT 4 — Resource Recommendation Engine — DONE, Ready to Commit (2026-09-12)

**Where we are:**
```text
Commit 1 Foundation ✅
   ↓
Commit 2 Skill Gap + Learning Path Engine ✅
   ↓
Commit 3 AI Learner Profiling ✅
   ↓
Commit 4 Resource Recommendation Engine ✅ ← YOU ARE HERE
```

**Problem solved:** Path listed `Embeddings, Vector DBs, RAG` but hackathon asks for `courses, projects and learning resources`. Now each path skill returns `resources[]` — Learn 📚 → Practice 🛠 → Assess 📝.

**Decision (implemented):** Option A — curated local `resources.json` (8 test resources, temp `example.com` URLs). Option B (live discovery) deferred. No vector DB / Qdrant yet. Priority kept: `WORKING MVP → POLISH → ADVANCED`.

**Files (verified):**
- `backend/app/schemas/resource.py` — Pydantic `Resource` (`gt=0`, `default_factory`, canonical `skill_id`) + INTERVIEW notes
- `backend/data/resources.json` — 8 entries (python×2, llm×1, prompt×1, embeddings×2, vector_db×1, rag×1), all `skill_id ∈ catalog`
- `backend/app/data_loader.py` — `load_resources()` + `load_all() → {skills, careers, resources}`
- `backend/app/services/resources/resource_matcher.py` — `50/20/20/10` deterministic scorer + INTERVIEW notes
- `backend/app/services/path/path_generator.py` — `generate_learning_path(..., resources, learner_level, preference, max_hours)` + `"resources":` per item
- `backend/app/api/routes/path.py` — `PathRequest` extended with optional `learner_level/preference/max_hours/resource_limit` (backward compatible)

**Verified (not invented):**
- DATA: `load_resources()=8`, `missing=[]`, Pydantic `validated=8`
- MATCHER: `embeddings/beginner/project → project 90.0 > course 80.0`
- API: `POST /api/path/generate → 200`, `embeddings → 2 resources` with `recommendation_score`
- TESTS: `pytest` not installed — smoke via `TestClient` used per skill §6.1 fallback
- SECURITY: no keys added in this commit

**Git checkpoint:** Ready for scoped commit `feat: add personalized resource recommendation engine`. See `backend/docs/INTERVIEW_PREP_COMMIT4.md` for Q&A.

---

## 🟢 COMMIT 3 - Canonical Knowledge Base + AI Learner Profiling — Ready to Push

**Endpoints Verified (2026-09-12)**:
- ✅ `POST /api/profile/extract` — AI extraction (Gemini) — GenAI/DataSci/Backend all 200, Sparse `skills: []` no hallucination
- ✅ `POST /api/profile/create` — Learner profile validated (Pydantic 0..100, float)
- ✅ `POST /api/path/generate` — Skill gaps + recommendations + learning path

**Make the commit (scoped — don't add LICENSE/README noise)**:
```bash
git add backend/app/schemas/profile.py backend/app/api/routes/profile.py backend/app/services/ai/llm_service.py backend/app/data_loader.py backend/data/skills_catalog.json backend/data/career_skills.json backend/data/prerequisites.json backend/docs/INTERVIEW_PREP_COMMIT3.md README.md StepsDone.md Phase_2A_Learner_Profile.md Projectdocs(PR)/README.md
# also:
# git add PATHFINDER_PROJECT_OVERVIEW.md Projectdocs(PR)/PROJECT_OVERVIEW.md
# if those were updated
git diff --cached   # must show no GEMINI_API_KEY
git commit -m "feat: add canonical skill catalog and AI-powered learner profiling"
git push
```

**Your Git History**:
1. feat: initialize PathFinder foundation
2. feat: implement skill gap and learning path engine
3. feat: add canonical skill catalog and AI-powered learner profiling ← **YOU ARE HERE** (Commit 3, 2026-09-12)

---

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

Database: SQLite (pathfinder.db)
Tables: learners, skills, learner_skills, careers, career_skills, prerequisites

## Steps Done - PathFinder Backend Foundation

### Folder Structure Created

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
│       ├── __init__.py
│       ├── skills/
│       │   └── skill_gap_service.py
│       ├── recommendation/
│       │   ├── __init__.py
│       │   └── recommendation_service.py
│       └── path/
│           ├── __init__.py
│           └── path_generator.py
├── api/
│   └── routes/
│       └── path.py
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

## Completed Steps

### STEP 1: Skill Gap Engine ✅
- Implemented `calculate_skill_gaps()` function
- Calculates gaps: `gap = required mastery - current mastery`
- Assigns priority scores: `priority = gap × importance weight`
- Sorts gaps by priority (highest first)
- Importance weights: critical=1.0, high=0.85, medium=0.65, low=0.40

### STEP 2: Create the Service ✅
- Created `backend/app/services/skills/skill_gap_service.py`
- Created folder structure: `services/ └── skills/ └── skill_gap_service.py`

### STEP 3: Understand this Algorithm ✅
- Gap calculation: `gap = required mastery - current mastery`
- Priority formula: `priority = gap × importance weight`
- Example: RAG gap=75, importance=critical, weight=1.0, priority=75
- Example: Docker gap=30, importance=medium, weight=0.65, priority=19.5

### STEP 4: Create the Recommendation Engine ✅
- Created `backend/app/services/recommendation/__init__.py`
- Created `backend/app/services/recommendation/recommendation_service.py`
- Implemented `recommend_skills()` function
- Considers prerequisite chains and current skill levels
- Returns recommendations with priority and status (ready/blocked)

### STEP 5: Why this Matters ✅
- Documented the importance of prerequisite-aware recommendations
- Example: RAG=0, Embeddings=0, LLM=70
- PathFinder suggests learning: Embeddings → Vector Database → Vector Search → Retrieval → RAG
- Prevents learning advanced topics without foundations

### STEP 6: Learning Path Generator ✅
- Created `backend/app/services/path/__init__.py`
- Created `backend/app/services/path/path_generator.py`
- Implemented `generate_learning_path()` function
- Turns recommendations into personalized learning path
- Respects prerequisite dependencies
- Organizes path into phases based on dependency levels

### STEP 7: Our First Complete Intelligence Pipeline ✅
- Established the core PathFinder engine pipeline:
  - Learner Skills → Career Requirements → Skill Gap Engine → Priority Gaps
  - → Recommendation Engine (with prerequisites) → Learning Path Engine → Personalized Path

### STEP 8: Now we need an API ✅
- Created `backend/app/api/routes/path.py`
- FastAPI router with `/api/path/generate` endpoint
- Accepts PathRequest with current_skills, career_requirements, prerequisites
- Returns skill_gaps, recommendations, and learning_path

### STEP 9: Connect the route ✅
- Modified `backend/app/main.py`
- Added: `from app.api.routes.path import router as path_router`
- Added: `app.include_router(path_router)` after app creation
- API now accessible at `GET /api/path/generate`

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /api/path/generate` - Generate learning path from current skills and career goals
- `POST /api/profile/create` - Create/validate learner profile (Phase 2A)

**Test Verified (2026-09-01)**: `POST /api/profile/create` validates Pydantic (hours=float, mastery 0..100) and `POST /api/path/generate` returns `skill_gaps`, `recommendations`, `learning_path`.

### 🚨 Architectural Point

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


---

### STEP 11: Canonical Knowledge Base (Commit 3) ✅

**Problem found before commit:** `career_skills.json` only mapped `genai_engineer` (26 rows); `data_scientist`/`backend_developer` had 0 rows. `skills_catalog.json` didn’t exist, so `sql`/`pandas`/`data_visualization` were not canonical — Gemini invented `sql` → 500. LLM also returned `experience_level: null` on sparse input → Pydantic `str` required → 500.

**Fix:**

1. **Created `backend/data/skills_catalog.json`** — 77 canonical skills (Programming 5, Data 6, Math 4, ML 6, Deep Learning 8, GenAI 19, Engineering 8, Backend 7, Deployment 6). Single source of truth. `data_loader.load_skills()` now prefers this file (priority 1), so prompt always shows `sql`, `pandas`, etc.

2. **Expanded `backend/data/career_skills.json`** — from 26 to 70 rows:
   - `genai_engineer` 26 (kept)
   - `ai_engineer` 10 (python, ml, neural_networks, deep_learning, nlp, computer_vision, fastapi, rest_api, docker, ai_system_design)
   - `ml_engineer` 11 (python, statistics, linear_algebra, ml, feature_engineering, model_evaluation, scikit_learn, deep_learning, pytorch, docker, mlops)
   - `data_scientist` 12 (python, sql, pandas, numpy, statistics, probability, data_cleaning, data_analysis, data_visualization, ml, model_evaluation, scikit_learn)
   - `backend_developer` 11 (python, oop, dsa, sql, databases, rest_api, fastapi, authentication, testing, docker, backend_architecture)

3. **Expanded `backend/data/prerequisites.json`** — 52 → 65 edges; added 13 Data/Backend edges: `pandas→python`, `numpy→python`, `data_cleaning→pandas`, `data_analysis→pandas`, `data_visualization→data_analysis`, `scikit_learn→python/ml`, `supervised/unsupervised→ml`, `databases→sql`, `rest_api→python`, `authentication→rest_api`, `testing→rest_api`.

4. **Created `backend/app/data_loader.py`** — defensive 3-priority loader: (1) `skills_catalog.json` if `[{id,name}]`, (2) `skills.json` if catalog-shaped, (3) derive from `career_skills+prerequisites+skills` deduped + fallback.

5. **Fixed `backend/app/schemas/profile.py`** — `skills: List[LearnerSkill] = Field(default_factory=list)` (mutable-default fix) for all list fields; `experience_level: Optional[str] = None` (sparse input no longer 500).

Referential integrity: every `career_skills.skill_id` and every `prerequisites.*` exists in `skills_catalog` (verified: 0 missing).

---

### STEP 12: AI Learner Profiling — `POST /api/profile/extract` (Commit 3) ✅

**Files:** `backend/app/services/ai/llm_service.py` (Gemini), `backend/app/api/routes/profile.py` (`/extract`), `backend/.env` (`GEMINI_API_KEY`, gitignored).

**LLMService design:**
- Prompt injects `AVAILABLE CAREERS` + `AVAILABLE SKILLS` (canonical) + 7 rules (only use listed IDs, mastery 0-100, confidence 0-1, no invention, null/[] on missing, return ONLY JSON).
- `client.models.generate_content(model="gemini-2.5-flash", contents=prompt)` → strip ``` fences → `json.loads`.
- Architecture: `Natural language → LLMService.extract_learner_profile() → JSON → Pydantic LearnerProfile` — LLM does **profile extraction only**, deterministic engine builds the path.
- Swap provider (Groq) by replacing `__init__`/`extract` without touching callers. Lazy `from google import genai` inside `__init__` so tests import without the package.

**Route `POST /api/profile/extract` (3-layer validation):**
1. Filter: drop `skill_id` not in `valid_skill_ids` (LLMs invent IDs — defense-in-depth).
2. Career ID check: `target_career` must be in `valid_career_ids` (`data_scientist` ✓, `Data Scientist` ✗).
3. Pydantic: `try: LearnerProfile(**extracted) except ValidationError → 400` (never 500 leak).

**Tests 2026-09-12 (all 200 before free-tier quota hit 20/day → 429):**
- GenAI: `python 85/ml 80/llm 30, target genai_engineer, hrs 10` ✓
- DataSci: `python 75/sql 75/statistics 70, target data_scientist, hrs 8` ✓
- Backend: `python 70/oop 40/rest_api 50/sql 50/databases 50, target backend_developer, hrs 12` ✓
- Sparse: `I want to become a Data Scientist. → skills: []` (no hallucination) ✓
- Canonical IDs ✓, mastery 0-100 ✓, confidence 0-1 ✓

**Interview prep:** `backend/docs/INTERVIEW_PREP_COMMIT3.md` (32 Q&A) + `INTERVIEW:` inline comments in 4 files.

## Next Steps

- Populate data files (careers.json, skills.json, prerequisites.json) with real data
- Create frontend components for user skill input and path visualization
- Implement full prerequisite tracking in database
- Add more skill domains beyond Phase 1C
- **Test API endpoints with sample data** ✅ (verified at http://127.0.0.1:8000)
- Extend LLM integration for natural language goal understanding
- Build React UI components for skill input and path visualization
- Implement progress tracking and adaptation features

---

### STEP 10: Phase 2A — Learner Profile (Natural Language → Structured Data) ✅

**Goal:** Convert what the learner tells PathFinder into structured information the engine can use.

**Why:** Engine expects `{"python":80,"machine_learning":65}` but learner says *"I know Python pretty well, I've done basic ML, I want to become GenAI engineer, 10 hrs/week"* — need bridge.

**Schema:** `backend/app/schemas/profile.py`
```python
from pydantic import BaseModel, Field
from typing import List, Optional

class LearnerSkill(BaseModel):
    skill_id: str
    mastery: float = Field(ge=0, le=100)

class LearnerProfile(BaseModel):
    name: Optional[str] = None
    target_career: str
    goal_description: Optional[str] = None
    experience_level: str
    skills: List[LearnerSkill] = []
    completed_courses: List[str] = []
    completed_projects: List[str] = []
    interests: List[str] = []
    hours_per_week: Optional[float] = None
    deadline: Optional[str] = None
    learning_preference: Optional[str] = None
```
Why Pydantic: `hours_per_week` → number, `mastery` → 0..100. Without: `"a lot"` slips through. With: `422` + judge-friendly explanation.

**API:** `backend/app/api/routes/profile.py`
```python
from fastapi import APIRouter
from app.schemas.profile import LearnerProfile
router = APIRouter(prefix="/api/profile", tags=["Learner Profile"])
@router.post("/create")
def create_profile(profile: LearnerProfile):
    return {"message": "Learner profile created successfully", "profile": profile}
```
Wired in `backend/app/main.py`: `from app.api.routes.profile import router as profile_router` + `app.include_router(profile_router)`
New endpoint: `POST /api/profile/create` (also in detail: `Phase_2A_Learner_Profile.md`).

**Design decision:** No 15-question form. One prompt — *"Tell me about your goal, experience, skills, and how you prefer to learn."* AI (Phase 2B Gemini/Groq) extracts Goal/Experience/Skills/Time/Deadline/Preference.

**Test (2026-09-01):** `TestClient POST /api/profile/create` → 200 ok, `hours="a lot"` → 422 float_parsing, `mastery=150` → 422 le=100, `POST /api/path/generate` still 200 with gaps.

**Pipeline now:**
```
Natural language → (Phase 2B LLM) → LearnerProfile (Pydantic) → Skill Gap Engine → Recommendation → Path
```

See `Phase_2A_Learner_Profile.md` for full Phase 2A doc.

---

## 🔮 What Comes After Commit 2 — Updated After Phase 2A

Core skill gap + path engine is working. Phase 2A added the Learner Profile bridge. Full PathFinder layers:

```
              USER
                ↓
    Natural language goal
                ↓
  AI Goal Understanding (LLM)
                ↓
    Learner Profile
                ↓
  Skill Gap Engine ✅ (Already implemented)
                ↓
Recommendation Engine ✅ (Already implemented)
                ↓
  Personalized Path ✅ (Already implemented)
                ↓
  Resources + Projects
                ↓
  Progress Tracking
                ↓
  Adaptive Updates
                ↓
   AI Assistant (LLM)
```

**Key Points**:
- Layers 4-6 are DONE (Skill Gap → Recommendation → Path)
- Layer 3 (Learner Profile) will be built next
- Layers 1-2 (Goal Understanding) will integrate LLM for natural language input
- Layers 7-10 will be built after the core is solidified
- **Don't jump ahead** - focus on getting `/api/path/generate` working with real data first

---

## 🧭 PathFinder Status So Far — Core Engine v0.2 (Commit 2 Complete)

We built the **engine and knowledge**, not yet the user-facing car:

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

### 1. End-to-End Pipeline (Currently Working)

```
Learner → Current skills → Skill Gap Engine → Compare vs Target Career → Skill Gaps → Recommendation Engine (Check prerequisites) → Recommended Skills → Learning Path Generator → Learning Path
```

### 2. FastAPI Backend — `backend/app/main.py` (Communication layer, future `React → FastAPI → PathFinder`)

### 3. Database Foundation — SQLite `pathfinder.db` + SQLAlchemy

6 models: `Learner`, `Skill`, `LearnerSkill`, `Career`, `CareerSkill`, `Prerequisite`
→ `Learner has Skills`, `Career requires Skills`, `Skill depends on Prerequisites`

### 4. Knowledge Base (~50 skills, 10 domains)

Programming, Mathematics, ML, Deep Learning, GenAI, Retrieval, RAG, Agents, Backend, Deployment, Career
Chain: `Python → ML → Transformers → LLM Fundamentals → Embeddings → Vector DB → RAG → AI Agents`

### 5. Career Knowledge (GenAI Engineer Deepest)

`GenAI Engineer` requires: Python, ML, Transformers, LLM Fundamentals, Prompt Eng, Embeddings, Vector DB, RAG, AI Agents, FastAPI, Docker, Cloud, System Design, Capstone (also AI Engineer, ML Engineer, Data Scientist, Backend Developer)

### 6. Prerequisite Graph — Directed Edges

`LLM Fundamentals → Embeddings → Vector DB → Vector Search → Retrieval → RAG` → PathFinder says *“Not ready for RAG — build Embeddings first”*

### 7. Skill Gap Engine — `WHAT YOU KNOW vs WHAT CAREER REQUIRES`

- Python 80/70 → READY, RAG 0/75 → GAP = 75

### 8. Recommendation Engine — Ranked by Priority

`priority = gap × importance_weight` (critical 1.0, high 0.85, medium 0.65, low 0.40)
RAG 75/critical → High, Docker 30/medium → Lower

### 9. Prerequisite Awareness

RAG 0 + Embeddings 0 → `Embeddings → Vector DB → Vector Search → Retrieval → RAG` (don’t jump to RAG)

### 10. Learning Path Generator — `Step 1→2→3→4` with `skill, current/target/gap, importance, readiness, reason`

e.g. `Step 4: RAG | 0/75 | Critical | Why: prerequisite retrieval skills must be developed first`

### 11. Current API — `POST /api/path/generate` (First End-to-End Backend Flow)

`Request → /api/path/generate → Skill Gap → Recommendation → Path Generator → JSON (skill_gaps + recommendations + learning_path)`

### ❌ What We Have NOT Built Yet

- Conversational interface (`“I want to become GenAI Engineer in 6 months”`)
- Learner onboarding (name, goal, experience, skills, hours/week, deadline, preference)
- Resource recommendations (Skill → courses/projects/videos/articles/assessments)
- Dashboard (progress, milestones, next action, learning path)
- AI assistant (Gemini/Groq)
- Adaptation loop (complete → assessment → new mastery → recalculate → update path)
- Frontend (React)

> Status: **PathFinder Core Engine v0.2** — real foundation, not UI mockup

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

### 🚀 Phase 2A Done — What Phase 2B Adds

Phase 2A built the **structured container** (`LearnerProfile` schema + `POST /api/profile/create`).

Phase 2B will add **LLM extraction**:

`“I’m a 3rd year student. I know Python and basic ML. I want GenAI Engineer in 6 months, 10 hrs/week, project-based.”`
→ Gemini/Groq →
```
LearnerProfile { target_career: "GenAI Engineer", experience_level: "intermediate", skills: [{skill_id:"python", mastery:70}, ...], hours_per_week: 10, deadline: "6 months", learning_preference: "project" }
```

Architecture after 2A:
```
                 USER
                   │ Natural language
                   ▼
          ┌──────────────────┐
          │ Goal Understanding│  ← Phase 2B (Gemini/Groq)
          └────────┬─────────┘
                   ▼
          ┌──────────────────┐
          │ Profile Extractor│  ← Phase 2B maps to LearnerProfile
          └────────┬─────────┘
                   ▼
            Learner Profile ✅ ← Phase 2A DONE → Skill Gap Engine → Recommendation → Learning Path
```

### 🟢 Git Status — Ready for Commit 3

```
Commit 1  feat: initialize PathFinder foundation
Commit 2  feat: implement skill gap and learning path engine
Commit 3  feat: add Phase 2A learner profile schema and API ← YOU ARE HERE
```

**Test gate passed (2026-09-01):** `POST /api/profile/create` + `POST /api/path/generate` both 200. Next step: **Phase 2B — Natural Language → LearnerProfile (Gemini/Groq extraction).**

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
