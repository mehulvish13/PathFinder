"""
Data loader — thin adapter over backend/data JSON files.
INTERVIEW PREP: See backend/docs/INTERVIEW_PREP_COMMIT3.md — Knowledge Base & Data Loader section

Your current data layout:
  data/skills.json         -> currently stores prerequisite edges [{skill_id, prerequisite_skill_id, type}]
  data/careers.json        -> [{id, name, description}]
  data/career_skills.json  -> [{career_id, skill_id, required_mastery, importance}]
  data/prerequisites.json  -> same as skills.json (duplicate)
  data/skills_catalog.json -> NEW canonical vocabulary [{id, name}] — preferred source

This loader is defensive: it derives an available_skills catalog from
career_skills + prerequisites so LLM prompts stay usable even when a
dedicated skill catalog doesn't exist yet. When you later add a proper
data/skills_catalog.json or fix skills.json to [{id, name, category}],
this module will prefer that file automatically.
"""
from __future__ import annotations

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_json(path: Path):
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    text = text.strip()
    if not text:
        return []
    return json.loads(text)


def load_skills() -> list[dict]:
    """
    Returns available skills as [{id, name}] for LLM prompts.

    Priority:
      1) data/skills_catalog.json if exists and looks like [{id, name}]
      2) data/skills.json if it contains a catalog shape
      3) Derived from career_skills.json + prerequisites.json (deduped, sorted)
    """
    catalog_path = DATA_DIR / "skills_catalog.json"
    if catalog_path.exists():
        raw = _load_json(catalog_path)
        if raw and isinstance(raw, list) and isinstance(raw[0], dict) and "id" in raw[0]:
            return [{"id": str(s["id"]), "name": str(s.get("name", s["id"]))} for s in raw]

    raw_skills = _load_json(DATA_DIR / "skills.json")
    # If skills.json is already a catalog shape (list of {id,name}), use it
    if raw_skills and isinstance(raw_skills, list) and isinstance(raw_skills[0], dict):
        keys = set(raw_skills[0].keys())
        if {"id", "name"} <= keys or {"skill_id", "name"} <= keys:
            # normalize skill_id -> id
            out = []
            for s in raw_skills:
                sid = s.get("id") or s.get("skill_id")
                if not sid:
                    continue
                out.append({"id": str(sid), "name": str(s.get("name", sid))})
            return out
        # If it's prerequisite edges (contains prerequisite_skill_id), fall through to derivation

    # Derive from career_skills + prerequisites
    skill_ids: set[str] = set()
    for path in [DATA_DIR / "career_skills.json", DATA_DIR / "prerequisites.json", DATA_DIR / "skills.json"]:
        raw = _load_json(path)
        if not raw:
            continue
        for row in raw:
            if not isinstance(row, dict):
                continue
            for k in ("skill_id", "id", "prerequisite_skill_id"):
                v = row.get(k)
                if v:
                    skill_ids.add(str(v).strip())

    # Also ensure common base skills that appear in course content
    for fallback in ["python", "machine_learning", "statistics", "linear_algebra", "probability"]:
        skill_ids.add(fallback)

    # Build display names from ids (snake -> Title)
    def display(sid: str) -> str:
        return sid.replace("_", " ").title()

    return sorted([{"id": sid, "name": display(sid)} for sid in skill_ids], key=lambda x: x["id"])


def load_careers() -> list[dict]:
    """Returns available careers as [{id, name}]."""
    raw = _load_json(DATA_DIR / "careers.json")
    out: list[dict] = []
    for c in raw:
        if not isinstance(c, dict):
            continue
        cid = c.get("id") or c.get("career_id") or c.get("name")
        if not cid:
            continue
        out.append({"id": str(cid), "name": str(c.get("name", cid))})
    return sorted(out, key=lambda x: x["id"])


def load_all() -> dict:
    return {"skills": load_skills(), "careers": load_careers()}
