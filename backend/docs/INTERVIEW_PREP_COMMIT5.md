# INTERVIEW PREP — Commit 5: Phase 4 Roadmap + Progress Tracking (2026-10-01, `7d253d5`)

**Verified facts only:** KB 77 skills / 5 careers / 70 career-skills / 65 prereqs / 8 resources (0 missing refs); 8-endpoint smoke PASS via `TestClient`; `data_scientist` → `Data Scientist` label check + old-client backward-compat check PASS; `.env` untracked, staged diff secret-scan clean.

## Basics (must know)

1. **Learning Path vs Roadmap?** Path = topological skill order; Roadmap = human UX (3-skill phases, milestones, hours, `next_action`).
2. **Why 3 skills per phase?** V1 simplicity — predictable chunks; prerequisite-aware grouping later.
3. **Activity vs Progress?** `Activity` = append-only event log (analytics/debugging); `Progress` = mutable snapshot (fast UI) with `UniqueConstraint(learner, resource)` for idempotent completes.
4. **MasteryHistory?** Time-series `(learner, skill_id, mastery, source, recorded_at)` — enables future velocity/decay + adaptive recalc. `skill_id` is canonical String (no FK to legacy Integer `skills.id` — avoids a migration in V1).
5. **Complete idempotency?** Second `POST /complete` returns 200 "already completed" without double mastery.
6. **Mastery heuristic?** V1 `+10 per completion` capped 100, `source="resource_completion"` — honest placeholder until Assessment Engine.
7. **`target_mastery = 70.0`?** V1 default; per-career `required_mastery` lookup deferred to Phase 5.
8. **Flow?** `Profile → Gaps → Path (+resources) → Roadmap → Activity/Complete → Progress/MasteryHistory → Dashboard/Notifications/Certificate`.

## Interview Q&A

1. Why separate roadmap from path? Algorithmic order vs pedagogical UX — milestones + time + single next action kill choice overload.
2. Why canonical career resolution in route? `data_scientist` id vs `Data Scientist` name — a DS learner must never get a GenAI-labeled roadmap.
3. Why optional `target_career`/`hours_per_week`? Backward compat — old clients get defaults (`GenAI Engineer`, `10.0`) and still 200.
4. What is `estimated_weeks`? `total_hours / hours_per_week`, guarded `None` — turns effort into calendar time; additive Optional field so old clients keep passing.
5. Why real-hours ETA in dashboard? Sums `estimated_hours` per remaining resource (fallback `1.0h`) — stays consistent with roadmap totals instead of a fake `count × 1`.
6. Why `UniqueConstraint(learner, resource)`? Rapid double-clicks can't create duplicate progress rows.
7. Why guarded `Skill` lookup (`try/except`, fallback to id)? Canonical string IDs vs legacy Integer PK — V1 never 500s on the join.
8. Dashboard in one endpoint? Single `DashboardResponse` (bar, mastery, milestones, next action, ETA) — one frontend call, no waterfall.
9. Notifications without a table? V1 in-app only, derived from `Progress` state (next_action/milestone-every-3/streak) — no push infra for MVP.
10. Certificate design? SHA-256 id, 404 when no work, 403 until 100% — employer-verifiable, honest gating.
11. Why `in_progress` before `not_started` in next_action? Finish-what-you-started reduces context switching.
12. Biggest risk? V1 mastery is completion-based, not knowledge-based — mitigated by documenting it and building Assessment next.
13. What would you change first in Phase 5? Replace `+10` with quiz scoring writing `source="quiz"`, then recalc gaps → adapt roadmap.
14. How scale progress writes? Append-only `Activity` partitions by learner; `Progress` upsert is O(1) per resource.

**One-liner:** "Deterministic path becomes a trackable journey — phases and milestones for humans, append-only events plus mutable snapshots for the machine, all validated before Commit 5."
