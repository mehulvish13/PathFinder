"""Phase 10R.1: prerequisite-aware learning-path engine.

Pure unit tests — no database, no app import, no network. Run under pytest
OR plain python (mirrors the test_phase6_adaptation.py convention):
    python tests/test_phase10r1_prerequisites.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.data_loader import load_career_requirements, load_prerequisites  # noqa: E402
from app.services.path.path_generator import (  # noqa: E402
    _get_unresolved_prerequisites,
    calculate_skill_gaps,
    generate_learning_path,
)
from app.services.prerequisites import (  # noqa: E402
    PrerequisiteCycleError,
    build_prerequisite_map,
    find_prerequisite_cycle,
    order_by_dependencies,
)
from app.services.recommendation.recommendation_service import recommend_skills  # noqa: E402
from app.services.roadmap import generate_roadmap  # noqa: E402


def _req(skill_id, required=70.0, importance="high"):
    return {"skill_id": skill_id, "required_mastery": required, "importance": importance}


def _rec(skill_id, current=0.0, required=70.0, priority=10.0):
    gap = max(required - current, 0.0)
    return {
        "skill_id": skill_id,
        "current_mastery": current,
        "required_mastery": required,
        "gap": gap,
        "importance": "high",
        "priority_score": priority,
    }


def test_1_prerequisite_map():
    edges = [{"skill_id": "rag", "prerequisite_skill_id": "embeddings", "type": "required"}]
    prereq_map = build_prerequisite_map(edges)
    assert prereq_map["rag"] == ["embeddings"], prereq_map
    # malformed rows must never become {"": [""]}
    dirty = edges + [
        {"skill_id": "", "prerequisite_skill_id": "x"},
        {"skill_id": "y", "prerequisite_skill_id": ""},
        {"skill_id": "  ", "prerequisite_skill_id": "  "},
        {"target_skill": "rag", "source_skill": "nope"},  # legacy keys ignored
        "not-a-dict",
    ]
    assert build_prerequisite_map(dirty) == {"rag": ["embeddings"]}, build_prerequisite_map(dirty)
    print("t1 prerequisite map canonical, no empty-string edges: PASS")


def test_2_unresolved_prerequisite():
    edges = [{"skill_id": "rag", "prerequisite_skill_id": "embeddings", "type": "required"}]
    prereq_map = build_prerequisite_map(edges)
    mastery = {"embeddings": 30.0, "rag": 0.0}
    required = {"embeddings": 70.0, "rag": 70.0}
    unresolved = _get_unresolved_prerequisites("rag", mastery, required, prereq_map)
    assert unresolved == ["embeddings"], unresolved
    path = generate_learning_path(
        [_rec("rag", priority=50.0), _rec("embeddings", current=30.0, priority=40.0)],
        edges, current_skills=mastery,
        career_requirements=[_req("rag"), _req("embeddings")],
    )
    rag = next(s for s in path["learning_path"] if s["skill_id"] == "rag")
    assert rag["status"] == "blocked" and "embeddings" in rag["prerequisites"], rag
    assert path["blocked_skills"] >= 1
    print("t2 low-mastery prerequisite blocks the target: PASS")


def test_3_satisfied_prerequisite():
    edges = [{"skill_id": "rag", "prerequisite_skill_id": "embeddings", "type": "required"}]
    prereq_map = build_prerequisite_map(edges)
    mastery = {"embeddings": 80.0, "rag": 10.0}
    required = {"embeddings": 70.0, "rag": 70.0}
    assert _get_unresolved_prerequisites("rag", mastery, required, prereq_map) == []
    recs = recommend_skills(
        [_rec("rag", current=10.0)],
        edges,
        mastery,
    )
    assert recs[0]["blocked_by"] == [] and recs[0]["readiness"] == "ready", recs[0]
    print("t3 satisfied prerequisite leaves the target unblocked: PASS")


def test_4_multiple_prerequisites():
    edges = [
        {"skill_id": "rag", "prerequisite_skill_id": "embeddings", "type": "required"},
        {"skill_id": "rag", "prerequisite_skill_id": "llm_fundamentals", "type": "required"},
    ]
    prereq_map = build_prerequisite_map(edges)
    mastery = {"embeddings": 85.0, "llm_fundamentals": 20.0, "rag": 0.0}
    required = {"embeddings": 70.0, "llm_fundamentals": 70.0, "rag": 70.0}
    unresolved = _get_unresolved_prerequisites("rag", mastery, required, prereq_map)
    assert unresolved == ["llm_fundamentals"], unresolved
    print("t4 only the unmastered prerequisite blocks: PASS")


def test_5_prerequisite_ordering():
    edges = [
        {"skill_id": "python_oop", "prerequisite_skill_id": "python", "type": "hard"},
        {"skill_id": "ml_fundamentals", "prerequisite_skill_id": "python_oop", "type": "hard"},
        {"skill_id": "rag", "prerequisite_skill_id": "ml_fundamentals", "type": "hard"},
    ]
    # recommendations deliberately in reverse priority order
    recs = [_rec("rag", priority=99.0), _rec("ml_fundamentals", priority=10.0),
            _rec("python_oop", priority=9.0), _rec("python", priority=1.0)]
    path = generate_learning_path(recs, edges)
    order = [s["skill_id"] for s in path["learning_path"]]
    for target, source in [("python_oop", "python"), ("ml_fundamentals", "python_oop"),
                           ("rag", "ml_fundamentals")]:
        assert order.index(source) < order.index(target), order
    assert order == ["python", "python_oop", "ml_fundamentals", "rag"], order
    print("t5 linear chain is topologically ordered: PASS")


def test_6_multiple_branches():
    edges = [
        {"skill_id": "embeddings", "prerequisite_skill_id": "python", "type": "hard"},
        {"skill_id": "llm_fundamentals", "prerequisite_skill_id": "python", "type": "hard"},
        {"skill_id": "rag", "prerequisite_skill_id": "embeddings", "type": "hard"},
        {"skill_id": "rag", "prerequisite_skill_id": "llm_fundamentals", "type": "hard"},
    ]
    recs = [_rec("rag", priority=99.0), _rec("llm_fundamentals", priority=5.0),
            _rec("embeddings", priority=5.0), _rec("python", priority=1.0)]
    path = generate_learning_path(recs, edges)
    order = [s["skill_id"] for s in path["learning_path"]]
    assert order.index("python") < order.index("embeddings") < order.index("rag"), order
    assert order.index("python") < order.index("llm_fundamentals") < order.index("rag"), order
    assert order[-1] == "rag", order
    print("t6 both branches precede the shared dependent: PASS")


def test_7_mastered_prerequisite():
    reqs = [_req("python"), _req("python_oop"), _req("ml_fundamentals", 60.0),
            _req("statistics", 60.0), _req("probability", 60.0), _req("linear_algebra", 60.0)]
    current = {"python": 90.0, "python_oop": 80.0, "statistics": 75.0,
               "probability": 75.0, "linear_algebra": 75.0, "ml_fundamentals": 20.0}
    edges = [
        {"skill_id": "python_oop", "prerequisite_skill_id": "python", "type": "hard"},
        {"skill_id": "ml_fundamentals", "prerequisite_skill_id": "statistics", "type": "soft"},
        {"skill_id": "ml_fundamentals", "prerequisite_skill_id": "probability", "type": "soft"},
        {"skill_id": "ml_fundamentals", "prerequisite_skill_id": "linear_algebra", "type": "soft"},
    ]
    gaps = calculate_skill_gaps(current, reqs)
    assert [g["skill_id"] for g in gaps] == ["ml_fundamentals"], gaps
    recs = recommend_skills(gaps, edges, current)
    path = generate_learning_path(recs, edges, current_skills=current, career_requirements=reqs)
    steps = [s["skill_id"] for s in path["learning_path"]]
    assert steps == ["ml_fundamentals"], steps  # mastered prereqs are not relearned
    assert path["learning_path"][0]["status"] == "ready", path["learning_path"][0]
    print("t7 mastered prerequisites are skipped, open skill is ready: PASS")


def test_8_cycle_detection():
    edges = [
        {"skill_id": "a", "prerequisite_skill_id": "b", "type": "hard"},
        {"skill_id": "b", "prerequisite_skill_id": "a", "type": "hard"},
    ]
    prereq_map = build_prerequisite_map(edges)
    cycle = find_prerequisite_cycle(prereq_map)
    assert cycle is not None and set(cycle) == {"a", "b"}, cycle
    assert find_prerequisite_cycle({"rag": ["embeddings"]}) is None
    try:
        generate_learning_path([_rec("a"), _rec("b")], edges)
    except PrerequisiteCycleError as e:
        assert "cycle" in str(e).lower(), e
    else:
        raise AssertionError("cycle did not raise PrerequisiteCycleError")
    try:
        order_by_dependencies(["a", "b"], prereq_map)
    except PrerequisiteCycleError:
        pass
    else:
        raise AssertionError("order_by_dependencies did not raise on a cycle")
    print("t8 cycles are detected, never silently ordered: PASS")


def test_9_real_genai_catalog():
    prereqs = load_prerequisites()
    assert all(set(e) == {"skill_id", "prerequisite_skill_id", "type"} for e in prereqs)
    assert len(prereqs) > 0
    reqs = load_career_requirements("genai_engineer")
    gaps = calculate_skill_gaps({}, reqs)  # fresh learner: nothing mastered
    recs = recommend_skills(gaps, prereqs, {})
    path = generate_learning_path(recs, prereqs, current_skills={}, career_requirements=reqs)
    assert path["total_skills"] == len(reqs) > 0
    assert path["blocked_skills"] > 0, path  # the graph is real and active
    assert path["ready_skills"] < path["total_skills"], path
    # every blocked step names a real, still-unresolved prerequisite
    prereq_map = build_prerequisite_map(prereqs)
    for step in path["learning_path"]:
        if step["status"] == "blocked":
            assert step["prerequisites"], step
            assert set(step["prerequisites"]) <= set(prereq_map[step["skill_id"]]), step
    # dependency order holds across the whole real path
    order = [s["skill_id"] for s in path["learning_path"]]
    for target, sources in prereq_map.items():
        if target in order:
            for source in sources:
                if source in order:
                    assert order.index(source) < order.index(target), (source, target)
    roadmap = generate_roadmap(path["learning_path"], "GenAI Engineer", hours_per_week=10.0)
    assert len(roadmap["phases"]) > 1, roadmap  # dependency layers, not one flat chunk
    assert roadmap["phases"][0]["skills"], roadmap
    print(f"t9 real GenAI graph active "
          f"(edges={len(prereqs)}, total={path['total_skills']}, "
          f"ready={path['ready_skills']}, blocked={path['blocked_skills']}, "
          f"phases={len(roadmap['phases'])}): PASS")


def test_10_recommendation_metadata():
    reqs = load_career_requirements("genai_engineer")
    prereqs = load_prerequisites()
    gaps = calculate_skill_gaps({}, reqs)
    recs = recommend_skills(gaps, prereqs, {})
    assert len(recs) > 0
    # no longer a universal wall of ready/empty metadata
    assert not all(r["readiness"] == "ready" for r in recs)
    assert not all(r["prerequisites"] == [] and r["blocked_by"] == [] for r in recs)
    assert any(r["readiness"] == "blocked" and r["blocked_by"] for r in recs)
    for r in recs:
        if r["readiness"] == "blocked":
            assert r["blocked_by"] and set(r["blocked_by"]) <= set(r["prerequisites"]), r
        else:
            assert r["blocked_by"] == [], r
    print("t10 recommendation readiness/blocked_by are truthful: PASS")


TESTS = [v for k, v in sorted(globals().items()) if k.startswith("test_")]

if __name__ == "__main__":
    failed = 0
    for t in TESTS:
        try:
            t()
        except AssertionError as e:
            failed += 1
            print(f"{t.__name__}: FAIL — {e}")
    print(f"{len(TESTS) - failed}/{len(TESTS)} Phase 10R.1 prerequisite checks passed")
    sys.exit(1 if failed else 0)
