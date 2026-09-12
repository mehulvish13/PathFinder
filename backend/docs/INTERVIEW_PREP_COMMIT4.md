# INTERVIEW PREP — Commit 4: Resource Recommendation Engine (2026-09-12)

**Verified facts only:** `resources.json=8`, `missing=[]`, `validated=8`; matcher `embeddings/beginner/project → project 90.0 > course 80.0`; `POST /api/path/generate → 200` with `resources[]`; `pytest` not installed — smoke via `TestClient`.

## Basics (must know)

1. **Skill vs Resource?** Skill=WHAT (RAG), Resource=HOW (course/project/docs/quiz for RAG).
2. **Resource fields?** `id/title/type/skill_id/difficulty/estimated_hours/url?/description/tags`.
3. **Allowed types?** `course, tutorial, documentation, project, assessment` only — keeps matcher predictable.
4. **Allowed difficulty?** `beginner/intermediate/advanced` → numeric 1/2/3 for distance scoring.
5. **Scoring weights?** `50 skill +20 difficulty +20 preference +10 time =100`.
6. **Why loader?** `load_resources()` centralizes source — JSON→SQLite→Qdrant later, no matcher change.
7. **Why temp example.com?** V1 priority schema+matcher; real URLs later with verification.
8. **Flow?** `Profile → Gap → Path → Required Skills → Matcher → Learn/Practice/Assess`.

## Interview Q&A

1. Why curated JSON not live search? MVP reliability/speed/deterministic demo; live later.
2. Why Pydantic for Resource? Blocks `hours=0`, enforces types at boundary.
3. Why `gt=0`? Prevents zero-hour cheat on time-fit +10.
4. Why `default_factory`? Avoids shared mutable `[]` bug (same as profile).
5. Why canonical `skill_id`? Matcher does `==` filter — invented IDs return [].
6. Why filter first then score? Guarantees skill match, scoring personalizes HOW.
7. Explain 50/20/20/10? 50 mandatory, 20 difficulty distance 0→20/1→10, 20 preference, 10 time.
8. Preference mapping? project→project, theory→course/docs/tutorial, mixed→+10.
9. Time fit? `estimated<=max_hours → +10`, respects availability without exclusion.
10. Why no LLM/embeddings? Deterministic, reproducible, explainable to judges.
11. How explain recommendation? Breakdown e.g. 50+10+20+10=90.
12. What if no resources? Return [], path survives — graceful degradation.
13. Why `limit`? Top-N per skill keeps path readable (default 3 in route, 5 in matcher).
14. Why optional route params? Backward compatible — old clients still get path + resources.
15. Why matcher in generator not route? Route thin, business logic in service (§5).
16. Why try/except around matcher? One bad resource must not kill whole path.
17. `status` vs `readiness`? Same — `ready/blocked` from prereq resolution.
18. How scale to 500? Same scorer + index, then SQLite, then Qdrant via loader.
19. How add real URLs? Verify reachability + skill relevance, keep canonical IDs.
20. Why no vector DB yet? `WORKING MVP → POLISH → ADVANCED`, avoid over-engineering.
21. How prove personalization? Same embeddings, project-learner gets project 90 first.
22. What changed in `path_generator`? Added `resources/learner_level/preference/max_hours` + `resources[]` per item, fixed `priority_score` legacy sort.
23. What changed in `path.py` route? Extended `PathRequest`, loads via `load_resources()`.
24. Biggest risk? Stale URLs, thin coverage (8) — mitigate with verification + growth.

**One-liner:** "LLM understands learner, deterministic core decides what and how — explainable 50/20/20/10 matching on curated canonical resources."
