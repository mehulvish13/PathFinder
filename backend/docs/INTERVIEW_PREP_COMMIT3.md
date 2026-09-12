# Interview Prep — Commit 3: Canonical Knowledge Base + AI Learner Profiling

> Covers every file touched/added in this commit. Read this before demo / viva / hackathon Q&A.
> Inline code also has `INTERVIEW:` comments — this doc is the full answer key.

---

## 0. One-Sentence Commit Summary

**Before:** LLM could invent skill/career IDs, only GenAI Engineer had requirements, `experience_level` crashed on null, no canonical vocabulary.
**After:** 77-skill canonical catalog (`skills_catalog.json`), 5 careers fully mapped, defensive 3-layer LLM validation (prompt → filter → Pydantic), every `/extract` test returns 200 with correct IDs.

```
Natural language → LLMService (Gemini) → JSON → filter invalid IDs → Pydantic LearnerProfile → 200
                                         ↕
                              skills_catalog.json (single source of truth)
                                         ↕
                              career_skills.json + prerequisites.json
```

---

## 1. `backend/app/schemas/profile.py` — Schema & Validation

### What changed
```python
# BEFORE
skills: List[LearnerSkill] = []
experience_level: str

# AFTER
skills: List[LearnerSkill] = Field(default_factory=list)
experience_level: Optional[str] = None
```

### Q1: Why `Field(default_factory=list)` instead of `= []`?
**A:** `[]` is a mutable default — Python creates it once and shares it across all instances. If one `LearnerProfile` does `profile.skills.append(...)`, it mutates the class default and every future instance sees that element. `Field(default_factory=list)` calls `list()` fresh for each instance. Pydantic docs explicitly recommend this. It's the same reason you never write `def f(x=[])`.

**Follow-up:** "Does `= []` always break?" — Not on every construction (Pydantic v2 copies), but `default_factory` is the canonical, future-proof pattern and interviewers check for it.

### Q2: Why `Optional[str] = None` for `experience_level`?
**A:** LLM returns `null` when the user says "I want to become a Data Scientist" with no experience hint. If the field is `str` (required), Pydantic raises `ValidationError: Input should be a valid string [input_value=None]` → 500. Making it `Optional` allows sparse profiles (good — no hallucination). The ` **INTERVIEW**` comment in code marks this.

### Q3: What does `Field(ge=0, le=100)` on `mastery` do?
**A:** Range guard at the validation boundary. Even if Gemini returns `mastery: 150`, Pydantic rejects it. `ge` = greater-or-equal, `le` = less-or-equal. `confidence` uses `default=0.5, ge=0, le=1`. Without this, downstream gap math (`required - current`) breaks.

### Q4: What is Pydantic's role here?
**A:** Runtime type coercion + validation. LLM returns raw `dict` (untrusted). `LearnerProfile(**extracted)` checks types, ranges, required fields, and constructs a typed object. Fail → `ValidationError` → we convert to 400 (not 500).

---

## 2. `backend/app/api/routes/profile.py` — API & 3-Layer Validation

### What changed
- Added `POST /api/profile/extract` (natural language → profile)
- 3 layers: (1) invalid-skill filter, (2) career-ID check, (3) `try: LearnerProfile(...) except ValidationError → 400`

### Q5: Walk me through the 3 layers. Why not just trust the prompt?
**A:**
1. **Prompt constraint:** "Only use skill IDs from available skills." — good but LLMs are stochastic and ignore instructions ~5-10% of the time (we saw `sql` invented when it wasn't in the derived list).
2. **Filter layer:** `valid_skill_ids = {s["id"] for s in skills}` then drop any `skill_id not in valid_skill_ids`. Same for `target_career`. This is defense-in-depth.
3. **Pydantic layer:** `LearnerProfile(**extracted)` catches range/type errors. Wrapped in `try/except ValidationError → HTTPException(400)`. Without this, invalid LLM output bubbles as 500 and leaks stack traces.

**Interview trap:** "Why not validate inside the LLM?" — You can't. LLM is non-deterministic; validation must be deterministic and outside.

### Q6: Why does `target_career` validation matter? Isn't "Data Scientist" fine?
**A:** Downstream `career_skills.json` is keyed by `data_scientist` (snake_case ID). If LLM returns `"Data Scientist"` (display name), the join `career_skills where career_id == profile.target_career` returns 0 rows → empty gap → broken path. Canonical IDs prevent `SQL` vs `sql` vs `structured_query_language` fragmentation.

### Q7: What do `APIRouter`, `HTTPException`, `ValidationError` do?
**A:**
- `APIRouter(prefix="/api/profile", tags=[...])` — groups routes, auto-generates OpenAPI docs at `/docs`.
- `HTTPException(status_code=400, detail=...)` — FastAPI converts to JSON error response. 400 = client error (bad input), 500 = server bug.
- `ValidationError` — Pydantic's exception when `**extracted` violates the schema. We catch it and re-raise as 400 so the client gets a readable message.

### Q8: Why `from app.data_loader import load_skills` inside the function, not at top?
**A:** Avoids circular import during startup and keeps the route decoupled from data file layout. Minor style — top-level import also works, but inline makes the dependency explicit for this endpoint.

---

## 3. `backend/app/services/ai/llm_service.py` — LLM Service

### Architecture decision (most asked)
**Q9: Why does LLM only extract the profile, not generate the whole learning path?**
**A:** Separation of intelligence:
- **LLM (non-deterministic, expensive)** → understands natural language, extracts structured facts. Good at language, bad at consistent graph traversal.
- **Deterministic engine (gap + prereq + recommendation)** → builds the path from `LearnerProfile + career_skills + prerequisites`. Predictable, testable, cheap.

If LLM generated the path directly, you'd get a different roadmap on every call and couldn't guarantee prerequisite ordering.

### Q10: How do you swap Gemini for Groq / another provider?
**A:** `LLMService` is a thin wrapper. Only `__init__` (client creation) and `extract_learner_profile` (prompt + `client.models.generate_content` call) are provider-specific. Callers do `from app.services.ai.llm_service import LLMService; llm.extract_learner_profile(...)` — they never import `google.genai` directly. Replace those two methods, keep the interface.

### Q11: Explain the prompt structure.
**A:**
```
AVAILABLE CAREERS:  (from load_careers — constrains target_career)
AVAILABLE SKILLS:   (from load_skills — constrains skill_id)
USER MESSAGE:       (raw natural language)
Rules: 7 rules — only use listed IDs, mastery 0-100, confidence 0-1, no invention, null/[] on missing, return ONLY JSON
Return structure:   fixed JSON schema so json.loads never chokes on prose
```
We inject the *current* catalog, so when we add `sql` the LLM immediately knows it's valid — no code change.

### Q12: Why `load_dotenv` + lazy `from google import genai` inside `__init__`?
**A:**
- `load_dotenv` — reads `backend/.env` so `os.getenv("GEMINI_API_KEY")` works locally without hardcoding. `.env` is in `.gitignore`, so keys never reach GitHub. If `.env` missing, we don't crash (tests import without a key).
- **Lazy import** — `from google import genai` is inside `__init__`, not at top. So `import LLMService` in a unit test (where `google-genai` may not be installed) doesn't fail. The `ImportError` only fires when you actually try to create a client.

### Q13: What is ` GEMINI_API_KEY=your_api_key_here` check?
**A:** Placeholder guard. If the user forgot to set a real key, we raise a clear `ValueError` instead of a cryptic auth error from Google.

### Q14: Why strip ``` fences?
**A:** Gemini often wraps JSON in ```json ... ``` markdown. `text.startswith("```")` → strip fences → `json.loads` succeeds. Without this, `json.loads("```json\n{...}")` throws.

### Q15: Model `gemini-2.5-flash` — why this one?
**A:** Fast, cheap, good at structured extraction. Flash is the speed-optimized tier; Pro would be slower/more expensive for no gain on this task. Exact model is swappable via `LLMService(model="...")`.

---

## 4. `backend/app/data_loader.py` — Knowledge Base Loader

### Q16: Explain the 3-priority `load_skills()` logic.
**A:**
1. **`skills_catalog.json` exists and is `[{id, name}]`** → return it directly. This is the new canonical path (77 skills). `str(s["id"])` normalizes.
2. **`skills.json` is already a catalog shape** (`{id,name}` or `{skill_id,name}`) → normalize `skill_id → id` and return. Handles legacy layouts.
3. **Derive** from `career_skills.json + prerequisites.json + skills.json` (dedup `skill_id / id / prerequisite_skill_id`) + fallback `["python","machine_learning","statistics","linear_algebra","probability"]` + `snake → Title` display. This kept the system usable before the catalog existed.

After Commit 3, priority 1 always wins, so priorities 2-3 are fallback only.

### Q17: What is a "canonical vocabulary"? Why does it matter?
**A:** One ID per concept, used everywhere: `sql` everywhere, never `SQL` / `sql_database` / `mysql` interchangeably. `skills_catalog.json` is the single source of truth; `career_skills.json`, `prerequisites.json`, `LearnerProfile.skill_id`, and LLM prompts all reference the same IDs. Without it, joins break and you get duplicate skills.

### Q18: Why `sorted(..., key=lambda x: x["id"])`?
**A:** Deterministic order. JSON file order shouldn't affect prompt order or tests. Sorted IDs make diffs stable.

### Q19: What does `_load_json` do? Why defensive?
**A:** `if not path.exists(): return []`, handles empty files, `json.loads` with UTF-8. The data files evolve; the loader shouldn't crash if a file is missing during early prototyping.

---

## 5. `backend/data/skills_catalog.json` — Canonical Catalog (NEW)

### Q20: Why 77 skills, not 20 or 200?
**A:** Covers all 5 careers without bloat. Categories: Programming (5), Data (6), Mathematics (4), ML (6), Deep Learning (8), GenAI (19), Engineering (8), Backend (7), Deployment (6). Each skill in `career_skills.json` must exist here — otherwise the LLM filter drops it. 77 is the minimal complete set for the MVP demo.

### Q21: What would break if you added a career but forgot its skills in the catalog?
**A:** LLM has no valid `skill_id` to emit for that career → either returns empty `skills` or invents an ID → filter drops it → profile has 0 skills → skill-gap engine thinks the learner knows nothing (wrong) or the invalid ID reaches the gap engine and causes a lookup miss.

---

## 6. `backend/data/career_skills.json` — Career Requirements

### Q22: Explain `required_mastery` and `importance`.
**A:**
- `required_mastery` (0-100) — target level for that career. Gap = `required_mastery - learner.mastery`. Larger gap = higher priority.
- `importance` (`critical` / `high` / `medium`) — tie-breaker when gaps are equal. `critical` skills are scheduled first. E.g., `data_scientist.sql` is `critical` (you can't be a DS without SQL), `ml_engineer.linear_algebra` is `medium`.

### Q23: Why does each career have ~10-12 skills, not 26 like GenAI?
**A:** GenAI Engineer is the most complex path (LLM + RAG + agents + backend). Data Scientist needs 12 (Python/SQL/pandas/stats/ML…), Backend needs 11 (Python/OOP/SQL/REST…). Scope matches demo depth — enough to show differentiation, not so many that prerequisites become unmanageable.

### Q24: How do you know the file is correct? Any typo risk?
**A:** We caught one: `"career_id": "neural_networks"` should be `"career_id": "ai_engineer"`. Validation: every `career_id` must be in `careers.json`, every `skill_id` must be in `skills_catalog.json`. A one-line check `assert all(r["career_id"] in career_ids)` would catch this in CI.

---

## 7. `backend/data/prerequisites.json` — Skill Graph

### Q25: What is `type: "hard"` vs `"soft"`?
**A:**
- `hard` — must be completed first (e.g., `pandas` hard-requires `python` — you can't use pandas without Python).
- `soft` — recommended but not blocking (e.g., `machine_learning` soft-requires `statistics` — helpful but you can start ML with minimal stats). Path generator uses `hard` edges to enforce ordering, `soft` edges to suggest but not block.

### Q26: New edges added — e.g., `pandas → python`, `databases → sql`. Why?
**A:** Before, the graph was GenAI-only. Data/Backend prerequisites were missing, so the path generator couldn't order `data_cleaning` after `pandas`. Adding these 13 edges completes the graph for all 5 careers.

### Q27: Could prerequisites have cycles? How to detect?
**A:** Yes, if you add `A→B` and `B→A`. The path generator does a topological sort; a cycle would cause infinite loop or stack overflow. Detect with DFS cycle check or `networkx.is_directed_acyclic_graph`. Our current graph is acyclic by construction.

---

## 8. Project Building Basics (often asked in viva)

### Q28: What does `uvicorn app.main:app --reload` do?
**A:** `uvicorn` is the ASGI server that runs FastAPI. `app.main:app` means "in `backend/app/main.py`, the variable `app = FastAPI()`". `--reload` watches files and auto-restarts on save (dev only).

### Q29: What is `backend/.env` and why is it in `.gitignore`?
**A:** Environment-specific secrets (API keys). `python-dotenv` loads it into `os.environ`. `.gitignore` contains `.env` so `git add .` never commits your `GEMINI_API_KEY`. Committing keys = security incident. The repo ships with `GEMINI_API_KEY=your_api_key_here` placeholder.

### Q30: How do you test `/extract`?
**A:** `http://127.0.0.1:8000/docs` (Swagger UI) → `POST /api/profile/extract` → paste `{"message": "..."}` → Execute. Or `python -c "import requests; requests.post(..., json={...}).json()"`. We ran 3 tests: Data Scientist (fairly well → 75%), Backend (OOP/APIs → 5 skills), minimal info (no hallucination → `[]`).

### Q31: What is the full data flow after this commit?
**A:**
```
User text → POST /api/profile/extract → LLMService (Gemini + catalog in prompt)
        → raw JSON → filter invalid skill/career IDs → Pydantic LearnerProfile
        → 200 { profile } → (next commit) Skill Gap Engine → Prerequisites → Recommendation → Learning Path
```

### Q32: How do you verify before committing?
**A:** (1) `python -c "from app.data_loader import load_skills; print(len(load_skills()))"` → 77, (2) 3 API tests return 200 with correct `target_career` IDs, (3) `skills: []` on sparse input (no hallucination), (4) `git status` shows only intended files.

---

## 9. Trick / Follow-up Questions

| Question | Answer |
|---|---|
| "Why not store skills directly in the LLM prompt without a catalog file?" | Prompt would drift from code; catalog lets you update data without touching Python, and gives a single place for validation. |
| "What if Gemini returns `mastery: 'high'` (string)?" | Pydantic `mastery: float` rejects it → 400. Could add a coercion layer, but failing fast is safer than guessing. |
| "Why not use an enum for `target_career`?" | Could — `Literal["genai_engineer", ...]` — but then adding a career requires a code change. String + runtime `valid_career_ids` check keeps data and code decoupled. |
| "How would you add a 6th career?" | Add to `careers.json` → add rows to `career_skills.json` (with catalog IDs) → add prerequisite edges if needed → no Python change → retest `/extract`. |
| "What is the next commit?" | Skill Gap Engine: `target_career → career_skills → learner.skills → gaps → prerequisite ordering → recommendations`. |

---

## 10. Files in This Commit — Checklist

- [ ] `backend/app/schemas/profile.py` — `Field(default_factory=list)`, `Optional[experience_level]`
- [ ] `backend/app/api/routes/profile.py` — `/extract`, filter, career check, `try/except ValidationError`
- [ ] `backend/app/services/ai/llm_service.py` — Gemini, prompt, fence stripping, lazy import
- [ ] `backend/app/data_loader.py` — 3-priority `load_skills()`, sorted, defensive
- [ ] `backend/data/skills_catalog.json` — 77 canonical skills (NEW)
- [ ] `backend/data/career_skills.json` — 5 careers × ~10-26 skills
- [ ] `backend/data/prerequisites.json` — +13 data/backend edges
- [ ] `backend/.env` — real key (not committed) + `.gitignore` guard
- [ ] `backend/docs/INTERVIEW_PREP_COMMIT3.md` — this file

**Commit message:**
```bash
git add backend/app/schemas/profile.py backend/app/api/routes/profile.py backend/app/services/ai/llm_service.py backend/app/data_loader.py backend/data/skills_catalog.json backend/data/career_skills.json backend/data/prerequisites.json backend/docs/INTERVIEW_PREP_COMMIT3.md
git commit -m "feat: add canonical skill catalog and AI-powered learner profiling"
git push
```
