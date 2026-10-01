# INTERVIEW PREP — Phase 5: Assessment Engine (2026-10-01, `62969c5`)

**Verified facts only:** 20 questions / 6 skills, all `skill_id ∈ catalog`, all `correct_index` valid; 12-check smoke PASS (no-leak, idempotent resubmit = 1 history row, 404/400 paths); Phase 4 regression PASS (path/progress/dashboard 200); proven loop 100% → mastery 0→70 → gap 70→0 → `ready`.

## Basics (must know)

1. **Bank vs Engine?** Bank = WHAT to ask (curated JSON); engine = HOW to run it (sample → score → blend → record). No LLM in scoring.
2. **Question fields?** `id/skill_id/question/options[4]/correct_index/difficulty/explanation`.
3. **Start vs Submit?** Start samples + snapshots `question_ids`, returns public questions only. Submit scores selections, blends mastery, records history.
4. **30/70 blend?** `new = 0.3 × previous + 0.7 × quiz` — prior evidence counts, fresh performance dominates, retakes after studying move mastery.
5. **Idempotent submit?** Stored `previous/new_mastery` make re-POST byte-identical; history appended once.
6. **Gap in result?** `gap_before/gap_after` vs `required_mastery` — the adaptive-loop proof Phase 6 recalculates from.
7. **Attempt snapshot?** `question_ids` JSON on the row — bank edits never rewrite quiz history.
8. **Flow?** `Learn → POST /start → answer → POST /submit → MasteryHistory(source=quiz) → gaps recalc → (Phase 6) roadmap adapts`.

## Interview Q&A

1. Why hide answers at start? The client is untrusted — key in start response makes every quiz 100%.
2. Why deterministic ordered sampling, not random? Reproducible tests + explainable results; randomness later with seeding.
3. Why blend instead of replacing mastery with quiz %? One lucky/poor sitting shouldn't erase history; 70% quiz weight still lets study show fast.
4. Why store prev/new on the attempt? Re-POST and GET /result replay identical numbers without re-deriving history.
5. Why 404 vs 400 on start? Unknown skill (bad id) vs known skill with no quiz (content gap) — different fixes.
6. Why missing answers = incorrect, not 400? Lenient for partial UI submits; still deterministic.
7. Why `source="quiz"` on history? Distinguishes measured mastery from `resource_completion` heuristic in trajectory analysis.
8. Why per-question feedback only in submit response? V1 stores outcomes, not answer sheets — GET replays aggregates.
9. Why no FK from `skill_id` to `skills.id`? Canonical string IDs vs legacy Integer PK — same V1 rule as MasteryHistory.
10. What breaks if bank edits a question post-submit? Nothing — attempt holds its own `question_ids` snapshot; submit revalidates against current bank.
11. Why bound `num_questions` 1–10? A skill quiz is a quick check, not an exam; bounds keep UX and scoring sane.
12. Biggest risk? Only 6 quizzable skills — bank growth is content work, engine already generic.
13. What does Phase 6 need from this? `gap_before/gap_after` per skill — the recalc input that reorders the path.
14. How scale to 10k attempts? Index on `(learner_id, skill_id)`; attempts are small rows, bank is read-only JSON.

**One-liner:** "Assessment turns completion into measurement — curated bank, deterministic scoring, blended mastery with gap deltas that the adaptive roadmap consumes next."
