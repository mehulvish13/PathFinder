"""Phase 6 regression: adaptation orchestration + RAG proof both directions.

Runs under pytest AND plain python (no pytest installed in this repo's venv):
    python tests/test_phase6_adaptation.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app.db.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.mastery_history import MasteryHistory  # noqa: E402

c = TestClient(app, raise_server_exceptions=False)
BANK = {q["id"]: q for q in json.load(open(Path(__file__).resolve().parent.parent / "data" / "assessments.json"))}
REQ = json.load(open(Path(__file__).resolve().parent.parent / "data" / "career_skills.json"))

L_BASE = 9100


def seed(learner_id, skill_id, mastery, source="self_assessment"):
    db = SessionLocal()
    db.add(MasteryHistory(learner_id=learner_id, skill_id=skill_id, mastery=mastery, source=source))
    db.commit()
    db.close()


def start_quiz(learner_id, skill_id, n=3, required=75.0):
    r = c.post("/api/assessment/start", json={
        "learner_id": learner_id, "skill_id": skill_id,
        "num_questions": n, "required_mastery": required})
    assert r.status_code == 200, r.text
    return r.json()


def submit(aid, correct=True, career=None, hours=10.0):
    body = {"assessment_id": aid, "answers": []}
    if career:
        body["target_career"] = career
        body["hours_per_week"] = hours
    # need question ids: fetch detail
    d = c.get(f"/api/assessment/{aid}").json()
    for q in d["questions"]:
        ci = BANK[q["question_id"]]["correct_index"]
        body["answers"].append({
            "question_id": q["question_id"],
            "selected_index": ci if correct else (ci + 1) % len(BANK[q["question_id"]]["options"])})
    r = c.post("/api/assessment/submit", json=body)
    assert r.status_code == 200, r.text
    return r.json()


def test_1_assessment_still_works():
    s = start_quiz(L_BASE + 1, "embeddings")
    res = submit(s["assessment_id"])
    assert res["percentage"] == 100.0 and res["adaptation"] is None
    print("t1 assessment still works: PASS")


def test_2_mastery_history_still_works():
    db = SessionLocal()
    n = db.query(MasteryHistory).filter(
        MasteryHistory.learner_id == L_BASE + 1,
        MasteryHistory.skill_id == "embeddings",
        MasteryHistory.source == "quiz").count()
    db.close()
    assert n == 1, n
    print("t2 mastery history still works: PASS")


def test_3_progress_endpoints_still_work():
    assert c.get(f"/api/progress/{L_BASE + 1}").status_code == 200
    assert c.get(f"/api/progress/{L_BASE + 1}/skills").status_code == 200
    assert c.get(f"/api/progress/dashboard/{L_BASE + 1}").status_code == 200
    print("t3 progress endpoints still work: PASS")


def test_4_path_generation_still_works():
    r = c.post("/api/path/generate", json={
        "current_skills": {"python": 80},
        "career_requirements": [{"skill_id": "python", "required_mastery": 70, "importance": "high"}],
        "prerequisites": []})
    assert r.status_code == 200 and "roadmap" in r.json(), r.text
    print("t4 path generation still works: PASS")


def test_5_adaptation_endpoint_works():
    r = c.post("/api/adaptation/recalculate", json={
        "learner_id": L_BASE + 1, "target_career": "genai_engineer", "hours_per_week": 10.0})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["career_id"] == "genai_engineer" and "roadmap" in j and "cleared_skills" in j
    print("t5 adaptation endpoint works: PASS")


def test_6_rag_mastered_leaves_gaps():
    L = L_BASE + 6
    seed(L, "rag_fundamentals", 30.0)
    before = c.post("/api/adaptation/recalculate", json={
        "learner_id": L, "target_career": "genai_engineer"}).json()
    assert "rag_fundamentals" in [g["skill_id"] for g in before["skill_gaps"]]
    s = start_quiz(L, "rag_fundamentals", required=75.0)
    res = submit(s["assessment_id"], correct=True, career="genai_engineer")
    assert res["new_mastery"] == 79.0, res  # 0.3*30 + 0.7*100
    assert res["gap_after"] == 0.0 and res["status"] == "ready"
    ad = res["adaptation"]
    assert ad is not None and "rag_fundamentals" in ad["cleared_skills"]
    assert "rag_fundamentals" not in [g["skill_id"] for g in ad["skill_gaps"]]
    after = c.post("/api/adaptation/recalculate", json={
        "learner_id": L, "target_career": "genai_engineer"}).json()
    assert "rag_fundamentals" not in [g["skill_id"] for g in after["skill_gaps"]]
    print("t6 RAG mastered leaves active gaps: PASS (gap 45 -> 0, cleared)")


def test_7_rag_unmastered_remains():
    L = L_BASE + 7
    seed(L, "rag_fundamentals", 30.0)
    s = start_quiz(L, "rag_fundamentals", required=75.0)
    res = submit(s["assessment_id"], correct=False, career="genai_engineer")
    assert res["new_mastery"] == 9.0, res  # 0.3*30 + 0.7*0
    assert res["status"] == "needs_work" and res["gap_after"] == 66.0
    gaps = [g["skill_id"] for g in res["adaptation"]["skill_gaps"]]
    assert "rag_fundamentals" in gaps
    print("t7 RAG unmastered remains in roadmap: PASS (gap 45 -> 66)")


def test_8_career_filtering_works():
    ds = c.post("/api/adaptation/recalculate", json={
        "learner_id": L_BASE + 8, "target_career": "data_scientist"}).json()
    ds_reqs = {r["skill_id"] for r in REQ if r["career_id"] == "data_scientist"}
    assert set(g["skill_id"] for g in ds["skill_gaps"]) <= ds_reqs
    assert "rag_fundamentals" not in [g["skill_id"] for g in ds["skill_gaps"]]
    assert ds["target_career"] == "Data Scientist"
    print("t8 career filtering works: PASS")


def test_9_hours_affect_estimation():
    w5 = c.post("/api/adaptation/recalculate", json={
        "learner_id": L_BASE + 8, "target_career": "genai_engineer", "hours_per_week": 5.0}).json()
    w20 = c.post("/api/adaptation/recalculate", json={
        "learner_id": L_BASE + 8, "target_career": "genai_engineer", "hours_per_week": 20.0}).json()
    assert w5["roadmap"]["estimated_weeks"] > w20["roadmap"]["estimated_weeks"] > 0
    print("t9 hours_per_week affects estimation: PASS "
          f"({w5['roadmap']['estimated_weeks']} vs {w20['roadmap']['estimated_weeks']} weeks)")


def test_10_unknown_career_404():
    r = c.post("/api/adaptation/recalculate", json={
        "learner_id": L_BASE + 8, "target_career": "jedi_master"})
    assert r.status_code == 404, r.text
    s = start_quiz(L_BASE + 10, "python", n=2)
    r2 = c.post("/api/assessment/submit", json={
        "assessment_id": s["assessment_id"],
        "answers": [{"question_id": q["question_id"], "selected_index": 0} for q in s["questions"]],
        "target_career": "jedi_master"})
    assert r2.status_code == 404, r2.text
    print("t10 unknown career returns 404: PASS")


TESTS = [v for k, v in sorted(globals().items()) if k.startswith("test_")]

if __name__ == "__main__":
    failed = 0
    for t in TESTS:
        try:
            t()
        except AssertionError as e:
            failed += 1
            print(f"{t.__name__}: FAIL — {e}")
    print(f"{len(TESTS) - failed}/{len(TESTS)} Phase 6 regression checks passed")
    sys.exit(1 if failed else 0)
