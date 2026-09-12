# PathFinder Delivery Skill — Professional Commit Checklist
> **Published on GitHub:** This file is the GitHub-tracked delivery checklist. Local canonical (gitignored) is `.opencode/skills/pathfinder-delivery/SKILL.md`. **Last synced:** 2026-09-12.
> Delivery protocol: **BEFORE** (Inspect 4) → **DURING** (Preserve 6) → **AFTER A-G** (CODE/DATA/TESTS/SECURITY/DOCUMENTATION/GIT/INTERVIEW). See local `.opencode` §0 for authoritative A-G table when working locally.

> Use this at **every** phase/commit. Copy the checklist into your prompt to Muse Spark so nothing is forgotten.
> Source of truth for Commit 3 pattern: `77-skill catalog + 5 careers + 65 prereqs + Gemini /extract + 3-layer validation`.

---

## When to Use

After any feature work (new endpoint, knowledge-base change, schema change) and **before** `git commit`. Keeps README, StepDone, Projectdocs, and interview prep in sync — the exact step the team missed before Commit 3.

---

## One-Prompt to LLM

Paste this at the start of each phase so the LLM remembers:

```
You are Muse Spark. At each PathFinder commit, you MUST:

1. Keep canonical IDs (skills_catalog.json is single source of truth).
2. Update ALL docs in sync: README.md, Projectdocs(PR)/README.md, StepsDone.md,
   Phase_2A_Learner_Profile.md (+ Projectdocs copy), PATHFINDER_PROJECT_OVERVIEW.md
   (+ Projectdocs copy), Projectdocs(PR)/FUTURE_ROADMAP.md.
3. Add INTERVIEW: inline comments to every touched file (see File Rules).
4. Create backend/docs/INTERVIEW_PREP_COMMIT<N>.md (32 Q&A).
5. Run the 9-point Commit Checklist (imports → 4 live tests → KB integrity → git hygiene → pytest/docs).
6. Never use `git add .` — use scoped `git add <files>` and verify with `git diff --cached`.
7. Never commit .env / GEMINI_API_KEY (check git ls-files + git diff --cached).

Follow this SKILL.md (and local .opencode/skills/pathfinder-delivery/SKILL.md when available) exactly.
```

---

## File Rules — What to Update Every Time

### 1. Code: `INTERVIEW:` Inline Comments (lightweight)

Add to **every touched file**, not just new ones:

| File type | Header comment | 2-3 line comments |
|-----------|---------------|-------------------|
| `schemas/*.py` | `INTERVIEW PREP: See backend/docs/INTERVIEW_PREP_COMMIT<N>.md — Schema section` | `Field(default_factory=list)` mutable-default, `Optional` for null, `ge/le` ranges |
| `api/routes/*.py` | `— API & Validation Layers section` | filter invalid IDs (defense-in-depth), canonical ID check, `try/except ValidationError → 400` |
| `services/ai/*.py` | `— LLM Service section` | `.env` + `.gitignore`, lazy import, fence stripping, swap provider |
| `data_loader.py` | `— Knowledge Base & Data Loader section` | 3-priority loader, sorted, defensive `_load_json` |
| Any new module | Same header + Q comments on tricky logic | |

Keep to 1-line ` # INTERVIEW: ...` — do not noise the code.

### 2. Docs: Always Sync These 7 Files

| File | What to change |
|------|---------------|
| `README.md` | Header `## 🟢 COMMIT <N> — <Title>`, Status, Endpoints (add new), Verified date + 4-test results, Project Structure (new files), Knowledge Base Files (catalog + counts), Validate JSON (add new file), GitHub Commit Summary (add новые checks), `## 🔮 What Comes After Commit <N>` |
| `Projectdocs(PR)/README.md` | **Mirror of root README.md** — keep identical |
| `StepsDone.md` | Header `## 🟢 COMMIT <N>`, Endpoints Verified block, `git add` scoped command, `**You are here**` line, inject new `### STEP <N>: <Title> ✅` before `## Next Steps` (problem → fix → files → tests) |
| `Phase_2A_Learner_Profile.md` | Schema snippet (`Field`/`Optional`), endpoints table (+ new route), `## 10. Commit <N> Addendum` before `## 9. Git`, commit message |
| `Projectdocs(PR)/Phase_2A_Learner_Profile.md` | Mirror of root |
| `PATHFINDER_PROJECT_OVERVIEW.md` | Table `Limited real-world data` → update counts if KB changed |
| `Projectdocs(PR)/PROJECT_OVERVIEW.md` | Mirror |
| `Projectdocs(PR)/FUTURE_ROADMAP.md` | Add `## 🟢 Commit <N> — <Title> — DONE` entry |

Do not touch `LICENSE` (CRLF warnings are phantom).

### 3. Interview Prep: `backend/docs/INTERVIEW_PREP_COMMIT<N>.md`

Structure (Commit 3 template, 32 Q&A):

```
0. One-sentence summary + diagram
1. schemas/*.py — 4 Qs (mutable default, Optional, ge/le, Pydantic role)
2. api/routes/*.py — 4 Qs (3 layers, trust, APIRouter/HTTPException/ValidationError, inline import)
3. services/ai/*.py — 7 Qs (why extraction only, swap provider, prompt, dotenv/lazy, placeholder guard, fences, model)
4. data_loader.py — 4 Qs (3-priority, canonical vocab, sorted, defensive)
5. skills_catalog.json — 2 Qs (why 77, missing skill breakage)
6. career_skills.json — 3 Qs (required_mastery/importance, 10-12 vs 26, typo guard)
7. prerequisites.json — 3 Qs (hard/soft, new edges, cycles)
8. Project building basics — 5 Qs (uvicorn, .env/.gitignore, test via /docs, data flow, verify)
9. Trick follow-ups — table
10. Checklist + scoped git add/commit
```

---

## Commit Checklist (9 Points) — Run Every Time

| # | Check | Command | Pass Criteria |
|---|-------|---------|---------------|
| 1 | Backend imports | `python -c "from app.main import app; from app.data_loader import load_skills, load_careers; print(len(load_skills()), len(load_careers()))"` | No ImportError, expected counts (Commit 3: 77, 5) |
| 2 | Profile API | `/docs` → `POST /api/profile/extract` (or `/create`) manual | 200 |
| 3 | 3 careers + canonical | Python script → 4 posts: GenAI, DataSci, Backend (all `target_career` in `{genai_engineer,data_scientist,backend_developer,ai_engineer,ml_engineer}`, skills in catalog, mastery 0-100, confidence 0-1) | 3×200 |
| 4 | Sparse robustness | `{"message":"I want to become a Data Scientist."}` | `skills: []`, no hallucination |
| 5 | Canonical IDs | `skill_id` lowercase no spaces, `career_id` snake_case | All valid |
| 6 | KB referential integrity | `python C:\Users\Pcc\AppData\Local\Temp\opencode\check_kb.py` (0 missing in any direction) | `career_skills.skill_id ∈ catalog`, `prerequisites.* ∈ catalog` |
| 7 | .env not tracked | `git ls-files \| findstr .env` empty + `.gitignore` has `.env` + `git diff --cached \| findstr GEMINI_API_KEY` empty | No secret leak |
| 8 | Git hygiene | `git status --short \| cat` + `git diff --stat \| cat` + `git diff --cached --stat \| cat` (bypass pager) | Scoped files only, no `LICENSE`/`path_generator` noise |
| 9 | Tests/docs | `python -m pytest -q` (or `FastAPI → /docs → 200` if no suite) | Green |

Free-tier note: `gemini-2.5-flash` is 20 RPD → `429 RESOURCE_EXHAUSTED` after heavy testing is **quota, not code bug** — verified tests before quota count as PASS. Fix: `gemini-1.5-flash` (1500 RPD) or `ClientError → 429` handler.

---

## Git Commands — Scoped (Never `git add .`)

```bash
# example Commit 3 — adapt file list per phase
git add backend/app/schemas/profile.py backend/app/api/routes/profile.py backend/app/services/ai/llm_service.py backend/app/data_loader.py backend/data/skills_catalog.json backend/data/career_skills.json backend/data/prerequisites.json backend/docs/INTERVIEW_PREP_COMMIT<N>.md README.md StepsDone.md Phase_2A_Learner_Profile.md PATHFINDER_PROJECT_OVERVIEW.md "Projectdocs(PR)/README.md" "Projectdocs(PR)/Phase_2A_Learner_Profile.md" "Projectdocs(PR)/PROJECT_OVERVIEW.md" "Projectdocs(PR)/FUTURE_ROADMAP.md" backend/app/main.py backend/requirements.txt

git status --short | cat
git diff --cached --stat | cat   # staged — this is what will commit
git diff --stat | cat            # unstaged — should NOT contain commit files
# verify no secret
git diff --cached | findstr GEMINI_API_KEY  # must be empty

git commit -m "feat: <concise title>"
git push
```

If you must use `git add .`, first:
```bash
git restore LICENSE
git restore backend/app/api/routes/path.py backend/app/services/path/path_generator.py # etc.
```

---

## Remember to LLM — Copy-Paste Footer

> After every code change in PathFinder, you will update README.md + Projectdocs/README.md + StepsDone.md + Phase doc + OVERVIEW + FUTURE_ROADMAP, add INTERVIEW: comments, create INTERVIEW_PREP_COMMIT<N>.md, run the 9-point checklist (including KB integrity script and 4 live tests), and use scoped git add. You will not use `git add .` and you will not commit `.env`.
> This maps to AFTER A-G: CODE (1-5) → DATA (6) → TESTS (9) → SECURITY (7) → DOCUMENTATION (2,4,6) → GIT (8) → INTERVIEW (3-5). See local `.opencode/.../SKILL.md §0` (gitignored) for full gate definitions when working locally.

---

## History

- Commit 3 (2026-09-12): Created `skills_catalog.json` (77), expanded `career_skills` 26→70, `prerequisites` 52→65, `Field(default_factory)`, `Optional[experience_level]`, `POST /api/profile/extract` + 3-layer validation, `data_loader.py` 3-priority, `INTERVIEW_PREP_COMMIT3.md` (this template derived from it).

Next phases: Skill Gap wiring, Recommendation, Resource Engine — same checklist applies.

