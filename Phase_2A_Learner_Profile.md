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

## 9. Git

After verification:

```bash
git add backend/app/schemas/profile.py backend/app/api/routes/profile.py backend/app/main.py Phase_2A_Learner_Profile.md README.md StepsDone.md
git commit -m "feat: add canonical skill catalog and AI-powered learner profiling"
git push
```

Next: **Phase 2B — Natural Language → LearnerProfile (LLM extraction with Gemini/Groq).**
