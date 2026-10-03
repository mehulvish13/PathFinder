# Phase 2A: Learner Profile — Natural Language → Structured Data

> **Goal:** Convert what the learner tells PathFinder into structured information that the recommendation engine can use.

```
Natural language
       ↓
AI understands it (Phase 2B: Gemini/Groq)
       ↓
Structured learner profile  ← YOU ARE HERE
       ↓
Skill Gap Engine
```

---

## 1. What we had before Phase 2A

The engine expected raw JSON:

```python
current_skills = {
    "python": 80,
    "machine_learning": 65
}
```

A real learner says:

> "I know Python pretty well, I've done basic ML, I want to become a GenAI engineer, and I can study around 10 hours a week."

Without this phase, there was no bridge between natural language and `current_skills / career_requirements / prerequisites`.

---

## 2. What Learner Profile contains

Focused MVP — directly addresses hackathon requirement: **needs, interests, learning patterns and goals**.

```
Learner Profile
│
├── Basic Information
│   └── name
│
├── Goal
│   ├── target_career          (required)  e.g. "GenAI Engineer"
│   └── goal_description       (optional)  free text
│
├── Experience
│   └── experience_level       (required)  "beginner" | "intermediate" | "advanced"
│
├── Skills
│   └── skills: [{skill_id, mastery 0-100}]
│
├── Learning History
│   ├── completed_courses: [str]
│   └── completed_projects: [str]
│
├── Interests
│   └── interests: [str]       topics of interest
│
├── Availability
│   └── hours_per_week: float  e.g. 10
│
├── Deadline
│   └── deadline: str          e.g. "6 months", "2026-08-01"
│
└── Learning Preference
    └── learning_preference    "project" | "theory" | "mixed"
```

---

## 3. Important design decision

**Do NOT ask 15 separate form questions.** That feels like a boring form.

Instead — one prompt:

> **"Tell me about your goal, current experience, skills, and how you prefer to learn."**

Example learner input:

> "I'm a beginner in AI. I know Python and a little ML. I want to become an AI engineer within 8 months. I can spend 8 hours a week and prefer learning through projects."

AI extracts (Phase 2B):

```
Goal:       AI Engineer
Experience: Beginner
Skills:     Python, Machine Learning
Time:       8 hours/week
Deadline:   8 months
Preference: Project-based
```

Phase 2A builds the **structured container** for that extraction. Phase 2B adds the **LLM extraction**.

---

## 4. Profile schema

**File:** `backend/app/schemas/profile.py`

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
    experience_level: Optional[str] = None  # Commit 3: Optional — sparse input returns null
    skills: List[LearnerSkill] = Field(default_factory=list)  # Commit 3: avoid mutable-default bug
    completed_courses: List[str] = Field(default_factory=list)
    completed_projects: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    hours_per_week: Optional[float] = None
    deadline: Optional[str] = None
    learning_preference: Optional[str] = None
```

---

## 5. Why Pydantic?

Reliable structured data for judges:

```python
# Without validation:
hours_per_week = "a lot"   # bad

# With Pydantic:
hours_per_week → float        # 422 if not a number
mastery → 0..100 (ge/le)     # 422 if 150
```

Pipeline:

```
LLM (Phase 2B)
 ↓
Structured JSON
 ↓
Pydantic validation (LearnerProfile)
 ↓
Reliable profile → Skill Gap Engine
```

---

## 6. Profile API

**File:** `backend/app/api/routes/profile.py`

```python
from fastapi import APIRouter
from app.schemas.profile import LearnerProfile

router = APIRouter(prefix="/api/profile", tags=["Learner Profile"])

@router.post("/create")
def create_profile(profile: LearnerProfile):
    return {
        "message": "Learner profile created successfully",
        "profile": profile
    }
```

**Wired in:** `backend/app/main.py`

```python
from app.api.routes.profile import router as profile_router
app.include_router(profile_router)
```

**Endpoints after Phase 2A:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/profile/create` | Create/validate learner profile |
| POST | `/api/profile/extract` | **NEW Commit 3** Natural language → LearnerProfile via Gemini (canonical catalog, 3-layer validation) |
| POST | `/api/path/generate` | Generate gaps → recommendations → path |
| GET | `/` , `/health` | Health |

---

## 7. Tests (verified 2026-09-01)

```bash
cd backend
.\venv\Scripts\python.exe -m pytest  # or manual:
```

```python
from fastapi.testclient import TestClient
from app.main import app
c = TestClient(app)
c.post("/api/profile/create", json={
  "target_career": "AI Engineer",
  "experience_level": "beginner",
  "skills": [{"skill_id": "python", "mastery": 80}],
  "hours_per_week": 10
})
# → 200

c.post("/api/profile/create", json={
  "target_career": "AI Engineer",
  "experience_level": "beginner",
  "hours_per_week": "a lot"
})
# → 422 float_parsing (Pydantic blocks bad data)

c.post("/api/profile/create", json={
  "target_career": "AI Engineer",
  "experience_level": "beginner",
  "skills": [{"skill_id": "python", "mastery": 150}]
})
# → 422 less_than_equal (mastery > 100 blocked)
```

---

## 8. Where this fits in the full journey

```
              USER
                ↓
    Natural language goal
                ↓
  AI Goal Understanding (LLM)        ← Phase 2B (Gemini/Groq)
                ↓
    Learner Profile  ✅              ← Phase 2A (this commit)
                ↓
  Skill Gap Engine ✅                ← Commit 2
                ↓
Recommendation Engine ✅
                ↓
  Personalized Path ✅
                ↓
  Resources + Projects               ← Phase 3
                ↓
  Progress + Adaptive Updates        ← Phase 4
```

---


---

## 10. Commit 3 Addendum — AI Extraction + Canonical Knowledge Base (2026-09-12)

### What changed

- **`skills_catalog.json` (NEW, 77 skills)** — canonical vocabulary; `data_loader.load_skills()` prefers it. All `career_skills` and `prerequisites` now reference it (0 missing IDs).
- **`career_skills.json` 26 → 70 rows** — all 5 careers mapped (see StepsDone STEP 11).
- **`prerequisites.json` 52 → 65 edges** — added Data/Backend prerequisites.
- **`profile.py` schema fix** — `Field(default_factory=list)` + `Optional[experience_level]`.
- **`llm_service.py` + `POST /api/profile/extract`** — Gemini prompt with `AVAILABLE SKILLS/CAREERS` + 7 rules, ``` fence stripping, 3-layer validation in route (filter invalid skills → career ID check → Pydantic try/except → 400).

### Why it matters

Before, `data_scientist` had no skill rows and `sql` wasn't canonical → Gemini hallucinated → 500. Now every career the LLM can return has canonical requirements, so extraction, gap, and path all join on the same IDs.

### Tests (2026-09-12)

All 200: GenAI / DataSci / Backend / Sparse (`skills: []`). Canonical IDs verified. Quota note: `gemini-2.5-flash` free tier is 20 RPD → 429 after heavy testing; swap to `gemini-1.5-flash` for higher quota or handle `ClientError` → 429 gracefully.

### Interview prep

`backend/docs/INTERVIEW_PREP_COMMIT3.md` + `INTERVIEW:` comments in `profile.py`, `profile route`, `llm_service.py`, `data_loader.py`.

## 11. Commit 5 Addendum — Roadmap Personalization + Progress Platform (2026-10-01, `7d253d5`)

### What changed

- **`POST /api/path/generate` request** — optional `target_career` (canonical id or display name, resolved via `load_careers()`: `data_scientist` → `Data Scientist`) + `hours_per_week`; defaults (`GenAI Engineer`, `10.0`) keep old clients working.
- **`Roadmap` schema** — additive `estimated_weeks` (`total_hours / hours_per_week`, guarded `None` when pace unknown).
- **Dashboard `estimated_time_remaining`** — sums real `estimated_hours` per remaining resource (fallback `1.0h` for ad-hoc ids) instead of `count × 1.0`.
- **`target_mastery = 70.0`** kept as documented V1 default (per-career `required_mastery` lookup deferred to Assessment phase).
- **7 progress endpoints** (Commit 5): `POST /activity`, `POST /complete` (idempotent), `GET /{id}`, `GET /{id}/skills`, `GET /dashboard/{id}`, `GET /notifications/{id}`, `GET /certificate/{id}` (SHA-256, 403 until 100%, 404 when empty).

### Why it matters

Before, every roadmap was labeled `GenAI Engineer` with an assumed 10 hrs/week — a Data Scientist learner got another career's roadmap. Now the roadmap carries the learner's actual career and pace through to `estimated_weeks`, while old clients still get valid responses.

### Tests (2026-10-01)

KB integrity PASS (77/5/70/65/8, 0 missing). 8-endpoint `TestClient` smoke PASS: DS label check + backward-compat check + full progress flow.

### Interview prep

`backend/docs/INTERVIEW_PREP_COMMIT5.md` + `INTERVIEW:` comments in `path.py`, `roadmap_generator.py`, `progress.py` routes, `roadmap.py` schema.

## 12. Phase 5 Addendum — Assessment Engine (2026-10-01, `62969c5`)

### What changed

- **`backend/data/assessments.json`** — 20 questions, 6 skills, all `skill_id ∈ catalog`.
- **`services/assessment/`** — deterministic sampling/scoring, 30/70 mastery blend into `MasteryHistory(source=quiz)`, idempotent submit.
- **`POST /api/assessment/start|submit`, `GET /api/assessment/{id}|{id}/result`** — answers never leaked at start; result carries `gap_before/gap_after`.

### Why it matters

First real feedback loop: quiz 100% → mastery 0→70 → gap 70→0 → `ready`, visible in existing `GET /progress/skills` with zero progress-code changes.

### Tests (2026-10-01)

Bank integrity PASS; 12-check smoke PASS (leak check, resubmit idempotency, 404/400 paths); Phase 4 regression PASS.

### Interview prep

`backend/docs/INTERVIEW_PREP_COMMIT6.md`.

## 13. Phase 6 Addendum — Adaptive Roadmap (2026-10-01, `39d5875`)

### What changed

- **`services/adaptation/`** — orchestration only: latest `MasteryHistory` → existing gap/recommend/path/roadmap engines → `cleared_skills`; career resolution 404.
- **`POST /api/adaptation/recalculate`** — full regenerated path + roadmap from current mastery.
- **`POST /api/assessment/submit` with `target_career`** — result gains `adaptation`, so a quiz auto-regenerates the roadmap (no second call).
- **`data_loader.load_career_requirements/load_prerequisites`** — single source for career rows + prereq edges.

### Why it matters

Assessment changes the plan, not just the profile: RAG 30→79 clears it from gaps; a failed quiz (→9) keeps it. Proved both directions plus career filtering, hours→weeks, unknown-career 404.

### Tests (2026-10-01)

`backend/tests/test_phase6_adaptation.py` — 10/10 PASS.

### Interview prep

`backend/docs/INTERVIEW_PREP_COMMIT7.md`.

## 14. Phases 8E–9 Addendum — Assessment UI + Tutor UI + Adaptive Links + Testing Polish (2026-10-03)

### What changed

- **8E (`77ee47d`, PR #5)** — `AssessmentLanding`/`AssessmentSession`/`AssessmentResult` on `POST /api/assessment/start|submit` + `GET /{id}/result`; answers never pre-leaked; post-submit refresh surfaces mastery/gap change.
- **8F (`47a5d21`, PR #6)** — `ChatThread`/`Composer`/`Tutor.tsx` on Phase 7 chat/explain endpoints; roadmap + skills deep-link into `/tutor?skill=<id>`; LLM explains only.
- **8G (`c7a1551`, PR #7)** — skill-context params across `/skills` ↔ `/assessment` ↔ `/roadmap` ↔ `/tutor`; `cleared_skills` + next action visible without manual reload. Backend untouched (prereq key-mismatch ticket carried).
- **Phase 9 (`03d6eb2`, PR #8)** — 14/14 backend sweep green + Phase 6 10/10 + Phase 7 4/4; removed dead duplicate `services/skill_gap_service.py`.

### Why it matters

Profile → gaps → path → assessment → mastery → adaptation → explanation is now one clickable journey a judge can follow, not isolated pages.

## 15. Phase 10A Addendum — Deployment Research Locked (2026-10-03)

Locked free/no-card prod boundary: Vercel (static dist) → Render Free (FastAPI `$PORT`, `/health`) → Neon Free Postgres (0.5 GB, 100 CU-hrs) + Gemini/Groq; local stays SQLite via `DATABASE_URL`. Render Free ephemeral FS ⇒ SQLite unsafe on Render (lost on restart; no disks on Free). CORS via `CORS_ORIGINS`; secrets in host env only. Next: 10B inspect `database.py`/models/seed → env-aware config → safe migrate → deploy. Full workflows + diagrams: root `README.md` Phase 10A section.

## 9. Git

After verification:

```bash
git add backend/app/schemas/profile.py backend/app/api/routes/profile.py backend/app/main.py Phase_2A_Learner_Profile.md README.md StepsDone.md
git commit -m "feat: add canonical skill catalog and AI-powered learner profiling"
git push
```

Next: **Phase 2B — Natural Language → LearnerProfile (LLM extraction with Gemini/Groq).**
