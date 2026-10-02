# INTERVIEW PREP — Phase 6: Adaptive Roadmap (2026-10-01, `39d5875`)

**Verified facts only:** 10/10 regression checks PASS via `backend/tests/test_phase6_adaptation.py`; KB integrity PASS; both RAG directions PASS (100% quiz → mastery 79 → gap 75→0 → cleared; failed quiz → mastery 9 → gap 45→66 → still in gaps); submit auto-adaptation returns `adaptation` in one call; unknown career 404; Phase 4/5 regression PASS.

## Basics (must know)

1. **Why orchestration, not a new engine?** Gap/recommend/path/roadmap already exist and are tested; adaptation just feeds them fresh mastery in the same order as `POST /api/path/generate`, so recalc can't disagree with a fresh path request.
2. **What triggers adaptation?** `POST /api/adaptation/recalculate` explicitly, or `POST /api/assessment/submit` with optional `target_career` (single round-trip).
3. **What does it read?** Latest `MasteryHistory` row per skill_id for the learner.
4. **What is `cleared_skills`?** Career-required skills whose latest mastery ≥ required and are no longer in active gaps.
5. **Unknown career?** 404 via `resolve_career` (id or display name, case-insensitive).
6. **Does hours_per_week matter?** Yes — `roadmap.estimated_weeks`; proven 8.0 vs 2.0 for same learner at 5 vs 20 h/week.
7. **Is it a persisted roadmap?** Not yet — V1 returns a fresh recalculated roadmap each call; persistence/UI diff is later.

## Interview Q&A

1. Why not store the recalculated roadmap? V1 keeps the loop stateless/testable; persistence comes with the frontend/UI diff view.
2. Why derive cleared skills instead of a flag? `calculate_skill_gaps` already encodes it as "gap 0 excluded" — `cleared = required AND current ≥ required AND not in gaps` is exact and needs no schema change.
3. How do you keep it consistent with manual path generation? Same loaders (`load_career_requirements`, `load_prerequisites`, `load_resources`), same engine order, same mastery source.
4. What if the learner has no mastery rows? All requirements produce gaps; roadmap is a fresh-start plan.
5. Why does submit carry `target_career` instead of a separate call? The frontend already has the career context at submit time — one round-trip, no orphaned adaptation state.
6. Why is adaptation optional on submit? Scoring must stay usable/testable without a career; old clients still get `AssessmentResultResponse` with `adaptation: null`.
7. Biggest V1 limit? Career requirements and roadmap are recomputed on read — fine at demo scale, cached later.
8. What would you add next? Roadmap versioning + diff ("2 skills cleared, 1 moved forward") to power the frontend timeline.

**One-liner:** "Adaptation is a thin orchestration layer over the same deterministic engines — mastery in, recalculated path out, assessment auto-triggers it."
