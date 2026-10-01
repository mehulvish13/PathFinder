"""Question bank loader — thin adapter over backend/data/assessments.json."""
from __future__ import annotations

import json
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent.parent.parent / "data" / "assessments.json"

ALLOWED_DIFFICULTY = {"beginner", "intermediate", "advanced"}


def _read_bank() -> list:
    if not DATA_FILE.exists():
        return []
    text = DATA_FILE.read_text(encoding="utf-8").strip()
    if not text:
        return []
    raw = json.loads(text)
    return raw if isinstance(raw, list) else []


def load_bank(valid_skill_ids: set | None = None) -> list[dict]:
    """Return validated questions. Defense-in-depth: drop malformed rows and
    unknown skill_ids so the bank can never quiz on invented skills."""
    out = []
    for q in _read_bank():
        if not isinstance(q, dict):
            continue
        qid = q.get("id")
        sid = q.get("skill_id")
        options = q.get("options")
        correct = q.get("correct_index")
        if not qid or not sid or not isinstance(options, list) or len(options) < 2:
            continue
        if not isinstance(correct, int) or not (0 <= correct < len(options)):
            continue
        if q.get("difficulty", "beginner") not in ALLOWED_DIFFICULTY:
            continue
        if valid_skill_ids is not None and str(sid) not in valid_skill_ids:
            continue
        out.append(
            {
                "id": str(qid),
                "skill_id": str(sid),
                "question": str(q.get("question", "")),
                "options": [str(o) for o in options],
                "correct_index": correct,
                "difficulty": str(q.get("difficulty", "beginner")),
                "explanation": str(q.get("explanation", "")),
            }
        )
    return sorted(out, key=lambda q: q["id"])


def get_questions_for_skill(skill_id: str, n: int, valid_skill_ids: set | None = None) -> list[dict]:
    """Deterministic slice (ordered by id) — same learner+skill always sees the
    same V1 quiz, which keeps tests reproducible and results explainable."""
    bank = [q for q in load_bank(valid_skill_ids) if q["skill_id"] == skill_id]
    return bank[: max(n, 0)]


def skills_with_questions(valid_skill_ids: set | None = None) -> list[str]:
    return sorted({q["skill_id"] for q in load_bank(valid_skill_ids)})
