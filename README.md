# PathFinder

AI-Powered Personalized Learning Path Recommender

## 🟢 PHASE 8A — React Frontend Foundation

**Status**: Frontend foundation complete ✅ — a React + Vite + TypeScript shell that consumes the existing FastAPI backend. Dashboard landed in Phase 8B (`756f536`; on `main` as `cd98c87`); roadmap landed in 8C, skills in 8D; remaining modules land in Phases 8E–8G.

- **Stack**: React 18, Vite 5, TypeScript (strict), React Router 6, native `fetch` API client (no axios), plain CSS (no Tailwind/UI libraries).
- **Routes** (root redirects to `/dashboard`): `/dashboard`, `/roadmap`, `/skills`, `/assessment`, `/tutor`.
- **Shell**: persistent sidebar with active-route indication, top bar with learner/career controls and a live backend connection indicator.
- **API client**: centralized in `frontend/src/services/api.ts`; base URL from `VITE_API_BASE_URL`. Errors are normalized to `ApiError` (network / HTTP / timeout / parse) so failures never crash the React tree.
- **Types**: `frontend/src/types/api.ts` mirrors the actual FastAPI response schemas.
- **Backend change**: added CORS middleware in `backend/app/main.py` (minimal, local dev origins only). No existing route/service logic changed.
- **Architecture rule**: the frontend only displays backend-derived results — it does not compute gaps, priorities, prerequisites, mastery, or roadmaps.

### Frontend setup

```bash
cd frontend
npm install
cp .env.example .env      # macOS/Linux — sets VITE_API_BASE_URL=http://127.0.0.1:8000
# Windows PowerShell: Copy-Item .env.example .env
npm run dev               # http://localhost:5173
```

> The frontend falls back to `http://127.0.0.1:8000` when `.env` is absent, so it still works with the default local backend without configuration.

Scripts: `npm run dev`, `npm run build` (typechecks with `tsc -b` then builds), `npm run preview`, `npm run typecheck`.

---

## 🟢 PHASE 8B — Personalized Dashboard (`756f536`)

**Status**: The basic Dashboard connectivity page is now the real PathFinder dashboard ✅ — it answers "Where am I in my learning journey, and what should I do next?" using only backend data. No hardcoded statistics; no frontend business logic.

- **Data sources (2 real endpoints, no invented APIs)**: `GET /api/progress/dashboard/{learner_id}` (progress, skill mastery, milestones, time remaining, progress-derived next action) + `POST /api/adaptation/recalculate` (skill gaps, recommendations, roadmap + roadmap next action).
- **Sections**: welcome/learner header → 4 summary cards → Current Focus (backend's top-priority recommendation) → Skill Gaps → Roadmap preview + Recent milestones → Next Action → Quick Actions (`/roadmap`, `/skills`, `/assessment`, `/tutor`).
- **Components**: 9 new in `frontend/src/components/dashboard/` (`DashboardHeader`, `SummaryCards`, `CurrentFocusCard`, `SkillGapsSection`, `RoadmapPreview`, `MilestonesCard`, `NextActionCard`, `QuickActions`, `DashboardSkeleton`); reuses `StatCard`, `PageHeader`, `ErrorState`, `EmptyState`.
- **States**: skeleton loading, distinct backend-unreachable / HTTP-error / no-data / partial-data errors with retry, honest empty states ("No learning path yet", "You're currently caught up").
- **Adaptive-ready**: fresh fetch on every load plus a Refresh button, so post-assessment mastery changes appear automatically. Backend remains the source of truth.
- **Backend change**: none.

**Verified 2026-10-03 (Phase 8B)**: `npm run typecheck` ✅, `npm run build` ✅ (63 modules), `/dashboard` serves HTTP 200 with live data (26 gaps, 9-phase roadmap for learner 1); Phase 6 regression 10/10, Phase 7 regression 4/4.

---

## 🟢 PHASE 8C — Personalized Learning Roadmap (`2d71160`)

**Status**: The complete `/roadmap` page ✅ — phased journey with milestones, per-skill learning steps, prerequisites, curated resources and working progress completion, all from backend data.

- **Data sources (3 real endpoints)**: `POST /api/adaptation/recalculate` (gaps, recommendations, learning-path steps with ready/blocked status + prerequisites, phased roadmap + next action) + `GET /api/progress/dashboard/{learner_id}` (overall progress, optional) + `POST /api/progress/complete` (Mark Complete per resource).
- **Sections**: career header → overview stats (phases, ready/blocked skill counts, duration, progress) → Already-mastered strip → phase timeline (Current vs Upcoming — the backend exposes no per-phase completion, so none is invented) → phase sections with milestone banners + step cards (mastery bars, importance/readiness badges, prerequisite chains, resources) → Next Action → links to `/skills` + `/assessment`.
- **Adaptive proof (live)**: completed a resource → mastery 0→10 → recalculated gap 75→65 on refresh. Backend remains authoritative; no optimistic mastery.
- **Backend change**: none. Known backend ticket (kept for 8G): `generate_learning_path` reads `target_skill`/`source_skill` keys while `load_prerequisites()` returns `skill_id`/`prerequisite_skill_id`, so `blocked` steps don't currently emerge; the UI renders them defensively. (Resolved in Phase 10R.1: canonical `skill_id`/`prerequisite_skill_id` contract, mastery-aware readiness, topological ordering, dependency-layered roadmap.)

**Verified 2026-10-03 (Phase 8C)**: `npm run typecheck` ✅, `npm run build` ✅ (70 modules), `/roadmap` serves HTTP 200; Phase 6 regression 10/10, Phase 7 regression 4/4. Merged via PR #3.

---

## 🟢 PHASE 8D — Skills & Progress Workspace (`d45db02`)

**Status**: The `/skills` workspace ✅ — answers "What skills do I have, what am I missing, and how is my mastery changing?" No second skill-gap engine in React; gaps are joined, never computed.

- **Data sources (3 real endpoints)**: `POST /api/adaptation/recalculate` (career-specific gaps, importance, cleared skills, resources) + `GET /api/progress/{learner_id}/skills` (recorded mastery + status) + `GET /api/progress/{learner_id}` (overall progress + `mastery_history` incl. quiz-sourced events).
- **Sections**: header + Refresh → overview (tracked / mastered / open gaps / overall progress) → filterable skill list (All / Open gaps / Mastered, backend priority order preserved) → detail panel (mastery bars, badges, prerequisites, resources, per-skill history) → global mastery-history timeline → Take Assessment (`/assessment`) + View Roadmap links.
- **Assessment reflection (live)**: 100% RAG quiz → mastery 0→70, quiz-sourced milestone recorded, gap 75→5 — all visible on refresh.
- **Backend change**: none.

**Verified 2026-10-03 (Phase 8D)**: `npm run typecheck` ✅, `npm run build` ✅ (77 modules), `/skills` serves HTTP 200 (26 tracked skills joined live); Phase 6 regression 10/10, Phase 7 regression 4/4. Merged via PR #4.

---

## 🟢 PHASE 8E — Assessment UI (`77ee47d`, PR #5)

**Status**: Interactive `/assessment` flow ✅ — learner picks a skill, takes a quiz, sees mastery change. No answer leaking in UI before submit; result replays stored aggregates.

- **Components** (`frontend/src/components/assessment/`): `AssessmentLanding` (skill picker + start), `AssessmentSession` (one-question-at-a-time, progress, submit), `AssessmentResult` (`percentage`, `previous/new_mastery`, `gap_before/gap_after`, `ready|needs_work` + per-question feedback).
- **Data sources**: `POST /api/assessment/start` → `POST /api/assessment/submit` → `GET /api/assessment/{id}/result`. Refreshes dashboard/skills/roadmap after submit so adaptation is visible.
- **Backend change**: none.

**Verified 2026-10-03 (Phase 8E)**: `npm run typecheck` ✅, `npm run build` ✅, `/assessment` serves HTTP 200; Phase 6 regression 10/10, Phase 7 regression 4/4.

---

## 🟢 PHASE 8F — AI Tutor UI (`47a5d21`, PR #6)

**Status**: Conversational `/tutor` experience ✅ — asks backend-grounded questions, explains roadmap decisions from actual learner state. Tutor never invents gaps/mastery.

- **Components** (`frontend/src/components/tutor/`): `ChatThread` (message list, loading/error states), `Composer` (input + send, retries). `frontend/src/pages/Tutor.tsx` owns session state.
- **Deep links in**: `LearningStepCard` (roadmap) + `SkillDetail` (skills) link into `/tutor?skill=<id>` with skill context, so "Why am I learning Vector DB?" carries real state.
- **Data sources**: AI tutor `chat` + `explain` endpoints (Phase 7 backend). Deterministic engines stay authoritative; LLM only explains.
- **Backend change**: none.

**Verified 2026-10-03 (Phase 8F)**: `npm run typecheck` ✅, `npm run build` ✅, `/tutor` serves HTTP 200; Phase 6 regression 10/10, Phase 7 regression 4/4.

---

## 🟢 PHASE 8G — Adaptive Journey Links (`c7a1551`, PR #7)

**Status**: Assessment → Skills → Roadmap → Tutor connected ✅ — one adaptive journey, not isolated pages.

- **What changed**: skill-context query params preserved across `/skills` ↔ `/assessment` ↔ `/roadmap` ↔ `/tutor`; post-quiz refresh surfaces `cleared_skills` + updated next action without manual reload.
- **Files**: `LearningStepCard.tsx`, `SkillDetail.tsx`, `Assessment.tsx`, `Skills.tsx` (deep-link params only).
- **Backend change**: none. Known ticket carried: `generate_learning_path` reads `target_skill`/`source_skill` while `load_prerequisites()` returns `skill_id`/`prerequisite_skill_id`, so `blocked` steps don't emerge; UIs render defensively. (Resolved in Phase 10R.1: canonical `skill_id`/`prerequisite_skill_id` contract, mastery-aware readiness, topological ordering, dependency-layered roadmap.)

**Verified 2026-10-03 (Phase 8G)**: `npm run typecheck` ✅, `npm run build` ✅; Phase 6 regression 10/10, Phase 7 regression 4/4.

---

## 🟢 PHASE 9 — Testing + Polish (`03d6eb2`, PR #8)

**Status**: Full-stack freeze check ✅ — backend sweep green, dead code removed, deployment unblocked.

- **Backend sweep 14/14**: profile, path, progress ×6, assessment ×3, adaptation, tutor, explain + Phase 6 10/10 + Phase 7 4/4 + full RAG journey green; all routes serve 200.
- **Cleanup**: removed dead duplicate `backend/app/services/skill_gap_service.py` (byte-identical to `services/skills/` copy; zero importers).
- **Deferred (product decision, not applied)**: prereq key-mismatch experiment in sandbox keeps suite 10/10 but flips fresh-learner path 26-ready/0-blocked → 5-ready/21-blocked (single-sweep ordering, no topological pass).
- **Convention**: SQLite lives at `backend/pathfinder.db` (absolute, CWD-independent since Phase 10); set `DATABASE_URL` to a PostgreSQL URL for production-like runs; never run row-count tests twice against the same scratch DB.

---

## 🚀 PHASE 10A — Deployment Platform Research (LOCKED 2026-10-03)

**Status**: Research complete ✅ — no code changed yet. Next: 10B inspect DB layer → env-aware SQLite-local/Postgres-prod config → migrate safely → deploy.

**Locked architecture (free/no-card-friendly):**

```text
                    ┌─────────────────────┐
                    │      GitHub         │
                    │  mehulvish13/       │
                    │     PathFinder      │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
          ┌──────────────┐            ┌──────────────┐
          │    Vercel    │            │    Render    │
          │              │            │              │
          │ React + Vite │  HTTPS     │   FastAPI    │
          │              │───────────►│              │
          └──────────────┘            └──────┬───────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                              ▼              ▼              ▼
                           Neon          Gemini          Groq
                         PostgreSQL       Primary        Fallback
```

- **Frontend**: Vercel (static `frontend/dist/` from `npm run build`; SPA rewrite via `frontend/vercel.json`; `VITE_API_BASE_URL` points at Render URL — never hardcode localhost in prod).
- **Backend**: Render Free (`rootDir: backend`, `pip install -r requirements.txt`, `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, `healthCheckPath: /health`; see `render.yaml`). 750 hrs/month, spins down after 15 min idle, ~1 min cold start — acceptable for demo, must be disclosed.
- **Database**: Neon Free PostgreSQL for deployed env (0.5 GB/project, 100 CU-hours, scale-to-zero 5 min, no card — plenty for learners/skills/progress/mastery/assessments/activities). Local dev stays SQLite. `DATABASE_URL` + `psycopg` env-aware config required; business logic untouched.
- **AI**: Gemini primary + Groq fallback preserved via existing provider abstraction; keys only in host env vars (`GEMINI_API_KEY`, `GROQ_API_KEY`), never in git.
- **CORS**: env-driven (`CORS_ORIGINS` in `backend/app/main.py` + `render.yaml`) — local origins by default, deployed Vercel origin appended in prod; never `allow_origins=["*"]`.

**Why not SQLite on Render Free:**

```text
FastAPI → SQLite → Render Free  ❌ UNSAFE
Deploy → SQLite works → service restarts/spins down → SQLite data disappears
```

Render docs: Free web services have an ephemeral filesystem — local SQLite lost on redeploy/restart/spin-down. Free services cannot attach persistent disks. Render Postgres Free expires after 30 days, so Neon is the persistent choice. Koyeb Free has the same no-persistent-volume + scale-to-zero issue. Railway is trial-credit only — excluded.

**Supabase vs Neon:** Supabase Free viable (500 MB, 5 GB egress) but pauses after 1 week idle + bundles unneeded platform; Neon simpler for pure Postgres persistence.

**Phase 10 execution order:**

```text
10A  Clean + freeze repository (DONE — research locked)
        ↓
10B  Inspect production configuration (DB layer: database.py, models, seed, env)
        ↓
10C  Choose deployment architecture (LOCKED above)
        ↓
10D  Deploy backend (Render)
        ↓
10E  Deploy frontend (Vercel)
        ↓
10F  Connect frontend ↔ backend (VITE_API_BASE_URL + CORS_ORIGINS)
        ↓
10G  Configure Gemini/Groq/DATABASE_URL secrets
        ↓
10H  Verify Postgres persistence (restart-safe demo learner)
        ↓
10I  Full deployed smoke test (GET /health → Profile → Path → Progress → Assessment → Adaptation → Tutor; /dashboard /roadmap /skills /assessment /tutor on deployed API)
        ↓
10J  Prepare demo learner/reset (GenAI Engineer, Intermediate, Python+ML known; LLM/Embeddings/VectorDB/RAG gaps; Reset Demo)
        ↓
10K  README + architecture docs
        ↓
10L  Screenshots (dashboard, roadmap, skill, assessment, mastery change, updated roadmap, tutor)
        ↓
10M  Demo video 3–5 min (cause → effect: Assessment → Mastery → Gap → Roadmap → AI explains why)
        ↓
10N  Submission package (source zip + PDFs + mp4 + screenshots + README)
        ↓
10O  Final regression
        ↓
🏁 PATHFINDER COMPLETE
```

**Phase 10 scope guard (V1):** ❌ Authentication, mobile app, Qdrant, RAG overhaul, Kubernetes, microservices, resource crawler, new ML recommender, admin dashboard, major UI redesign.

---

### Backend setup

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload   # http://127.0.0.1:8000
```

**Ports**: backend `127.0.0.1:8000` (API docs at `/docs`), frontend dev server `localhost:5173` (preview `localhost:4173`). The backend CORS config allows these local origins.

---

## 🟢 PHASE 10 — Production Readiness (CODE COMPLETE — manual deploy steps pending)

**Status**: DB config env-aware ✅, PostgreSQL driver added ✅, CORS env-driven ✅ (was already in 8E-era main.py), render.yaml + .env.example ✅, frontend `VITE_API_BASE_URL` + SPA fallback ✅ (already in place). Remaining: create Neon DB, deploy Render + Vercel, smoke-test deployed URLs, screenshots, demo video, submission zip.

**10B/10C — Database config (verified 2026-10-03):**

- `backend/app/db/database.py` now: `DATABASE_URL` env var wins; unset → SQLite at absolute `backend/pathfinder.db` (no more CWD-relative file); `postgres://` normalized to `postgresql://`; `check_same_thread` only applied to SQLite; `pool_pre_ping=True`; engine/session/`Base` unchanged, `get_db()` contract unchanged.
- Added `psycopg2-binary==2.9.13` to `backend/requirements.txt` (SQLAlchemy 2.0.52 already present).
- All models audited: `String`/`Float`/`Integer`/`DateTime`/`func.now()`, JSON stored as `String` text (`assessment_attempts.question_ids`), no SQLite-only SQL — portable to PostgreSQL as-is. No Alembic introduced (create_all is sufficient for V1).
- AI provider: Gemini only in code (`LLMService.generate_tutor_response` + `extract_learner_profile`); keys via `backend/.env` / host env vars, never frontend. Groq fallback noted in docs but not implemented in code.

**Verification run 2026-10-03:**

```text
Phase 7 AI tutor suite:  4/4 PASS
Phase 6 adaptation:      13 passed, 1 failed (test_2_mastery_history_still_works —
                         known CWD/persistent-row-count contamination, documented,
                         NOT a new failure; n==9 vs expected 1 on shared backend DB)
Frontend typecheck:      PASS
Frontend production build: PASS (dist/, 242.80 kB JS)
uvicorn app.main:app:    boots, GET /health → {"status":"healthy"} ✅
postgres:// URL import:  normalizes to postgresql://, driver resolves ✅
Secret scan (git grep):  no keys/tokens in tracked files ✅
```

**Manual steps remaining (require your accounts — cannot be automated here):**

1. **Neon**: create project → copy PostgreSQL connection string → set as `DATABASE_URL` on Render (append `?sslmode=require` if not present).
2. **Render**: Dashboard → New → Blueprint → select `mehulvish13/PathFinder` → set `DATABASE_URL`, `GEMINI_API_KEY`, `CORS_ORIGINS=https://<your-app>.vercel.app` → Apply. Backend URL: `https://pathfinder-api-<hash>.onrender.com`, verify `GET /health`.
3. **Vercel**: Import repo → Root Directory `frontend` → env `VITE_API_BASE_URL=https://<render-url>` → Deploy. `vercel.json` already rewrites all routes to `index.html` (SPA deep links work).
4. **Smoke test** the deployed pair: `/health`, profile create, path generate, dashboard, assessment start/submit, adaptation recalculate, AI tutor "Why did my roadmap change?".
5. **Demo flow** (3–5 min): profile → skill gaps → roadmap → RAG skill → assessment → mastery change → updated roadmap → ask AI tutor why → architecture slide.
6. **Submission package**: `PathFinder-Submission/{source,documentation,screenshots,demo}` per brief.

**Architecture (unchanged, now deployed):**

```text
React/Vite (Vercel)
      ↓ HTTPS
FastAPI (Render)
      ↓
Deterministic engines (gaps · prereqs · roadmap · mastery · adaptation)
      ↓
Neon PostgreSQL        Gemini (primary) / Groq (documented fallback)

LLM explains ← never decides (gaps, mastery, roadmap order, priorities
come from the deterministic backend).
```

---

## 🟢 PHASE 6 — Adaptive Roadmap Recalculation (2026-10-01, `39d5875`)

**Status**: The core intelligence loop is now closed ✅ — assessment → mastery → auto-recalculated roadmap.

- `POST /api/adaptation/recalculate` — reads latest `MasteryHistory`, reruns gap → recommend → path → roadmap, returns `cleared_skills`
- `POST /api/assessment/submit` — optional `target_career`/`hours_per_week` now also returns `adaptation`, so a quiz automatically regenerates the roadmap (no second call)
- `cleared_skills` = required skills whose latest mastery now meets target and dropped out of active gaps

**Verified 2026-10-01 (Phase 6)**: 10/10 regression checks PASS (`backend/tests/test_phase6_adaptation.py`), incl. both RAG directions — gap 45 → 0 + cleared after 100% quiz; gap 45 → 66 + still in path after failed quiz. Career filtering, hours→weeks, unknown-career 404 all PASS. Next: Phase 7 AI explanations/tutor.

---

## 🟢 PHASE 5 — Assessment Engine Complete (2026-10-01, `62969c5`)

**Status**: First real learning feedback loop ✅ — `Learn → Assessment → Score → Mastery update → Gap recalc`

**Endpoints**:
- `POST /api/assessment/start` — Start quiz for a skill (`learner_id`, `skill_id`, `num_questions` 1–10, `required_mastery`); never leaks answers
- `POST /api/assessment/submit` — Score answers → 30/70 mastery blend → `MasteryHistory(source=quiz)`; idempotent re-POST
- `GET /api/assessment/{id}` — Attempt detail (public questions + status/score)
- `GET /api/assessment/{id}/result` — Stored aggregates: `percentage`, `previous/new_mastery`, `gap_before/gap_after`, `ready|needs_work`

**Verified 2026-10-01 (Phase 5)**: 20 questions / 6 skills, bank integrity PASS (0 problems). 12-check smoke PASS: 100% quiz → mastery 0→70 → gap 70→0 → `ready`; `GET /progress/skills` reflects it with zero progress-code changes. Next: Phase 6 Adaptive Roadmap.

---

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
- `POST /api/assessment/start` — Start skill quiz (answers never leaked)
- `POST /api/assessment/submit` — Score → mastery blend → gap recalc (idempotent); optional `target_career` also returns `adaptation` (Phase 6)
- `GET /api/assessment/{id}` + `GET /api/assessment/{id}/result` — Attempt detail + stored result
- `POST /api/adaptation/recalculate` — Regenerate gaps/path/roadmap from latest mastery (Phase 6)

**Verified 2026-10-01 (Commit 5)**: KB integrity PASS (77 skills, 5 careers, 70 career-skills, 65 prerequisites, 8 resources — 0 missing refs). 8-endpoint smoke PASS via `TestClient`, including `data_scientist` → `Data Scientist` roadmap label check + old-client backward-compat check. Followed by Phase 5 Assessment Engine (`62969c5`).

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
- `POST /api/assessment/start` - Start skill quiz, answers never leaked (Phase 5)
- `POST /api/assessment/submit` - Score → mastery update → gap recalc (Phase 5); optional auto-adaptation (Phase 6)
- `POST /api/adaptation/recalculate` - Regenerate path/roadmap from latest mastery + cleared skills (Phase 6)
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
│   │   ├── assessment/  # question_bank.py + assessment_service.py — deterministic scoring, 30/70 mastery blend (Phase 5)
│   │   └── path/
│   ├── api/routes/      # profile.py (/create + /extract), path.py (+target_career/hours_per_week), progress.py (7 endpoints), assessment.py (start/submit/get/result)
│   └── data_loader.py   # canonical catalog loader (skills_catalog.json priority)
├── data/
│   ├── skills_catalog.json   # NEW — 77 canonical skills (single source of truth)
│   ├── skills.json           # prerequisite edges (legacy, fallback)
│   ├── prerequisites.json    # 65 edges (hard/soft) — now includes data/backend: pandas→python, databases→sql...
│   ├── careers.json          # 5 careers
│   ├── career_skills.json    # 70 rows — all 5 careers mapped (genai 26, ai 10, ml 11, data_sci 12, backend 11)
│   ├── resources.json
│   ├── projects.json
│   ├── assessments.json  # 20 questions, 6 skills, all IDs canonical (Phase 5)
│   └── assessments/      # empty dir (reserved)
├── docs/
│   ├── INTERVIEW_PREP_COMMIT3.md
│   ├── INTERVIEW_PREP_COMMIT4.md
│   └── INTERVIEW_PREP_COMMIT5.md  # roadmap/progress/dashboard Q&A (Commit 5)
│   └── INTERVIEW_PREP_COMMIT6.md  # assessment engine Q&A (Phase 5)
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
✓ **Phase 5 Assessment Engine (`62969c5`)** — 20-question bank (6 skills); start/submit/result endpoints; 30/70 mastery blend to `MasteryHistory(source=quiz)`; `gap_before/gap_after` proves the loop

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
   Assessment Engine ✅              ← Phase 5 (`62969c5`)
                 ↓
   Adaptive Roadmap                  ← NEXT (Phase 6)
                 ↓
   Real Mastery Updates → AI Assistant (LLM)
```

**Current State**: Layers 1-10 are complete (… → Roadmap → Progress → Dashboard/Certificate → Assessment → quiz mastery updates)
**Next Step**: Phase 6 — Adaptive Roadmap (an assessment result must change the recommended sequence automatically)
**Focus**: `62969c5` verified 2026-10-01; result already carries `gap_before/gap_after` for the recalc

---

## 🧭 PathFinder Status So Far — Commit 5: Roadmap + Progress Platform (2026-10-01)

We have built the **core backend intelligence + learner profile bridge + canonical knowledge base + AI extraction + resources + roadmap + progress tracking + assessment**. Think of it like a car — engine, knowledge, driver intake, dashboard, and now the **examiner** work; next is the **adaptive cruise control** (roadmap recalculation from quiz results).

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

### 🚀 NEXT: Phase 6 — Adaptive Roadmap

Phase 5 finished the **measurement loop** (`Learn → Assessment → Score → Mastery → Gaps recalculated`).

Phase 6 closes it — **an assessment result changes the recommended sequence automatically**:

```
Before assessment:  RAG 30% BLOCKED → learn Vector DB first
        ↓ RAG quiz 85%
After:              RAG 85% READY → prerequisite cleared → next eligible skill moves forward
        ↓
Roadmap recalculates → Next action updates
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
Commit 5  feat: add Phase 4 roadmap + progress tracking system (4A-4E) (`7d253d5`, 2026-10-01)
Phase 5  feat: add Phase 5 assessment engine (`62969c5`, 2026-10-01) ← YOU ARE HERE
```
**Phase 5 pushed** — assessment loop verified 2026-10-01. Next: **Phase 6 — Adaptive Roadmap.**
