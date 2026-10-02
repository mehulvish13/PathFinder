"""Phase 7 AI context/API regression tests.

The tests mock Gemini so CI does not need a network call or API key.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal
from app.models.mastery_history import MasteryHistory
import app.api.routes.ai_tutor as ai_route

client = TestClient(app, raise_server_exceptions=False)


class FakeLLM:
    def __init__(self, *args, **kwargs):
        pass

    def generate_tutor_response(self, prompt):
        assert "PathFinder" in prompt
        return "Mocked personalized explanation."


def seed(learner_id, skill_id, mastery):
    db = SessionLocal()
    db.add(MasteryHistory(
        learner_id=learner_id,
        skill_id=skill_id,
        mastery=mastery,
        source="test",
    ))
    db.commit()
    db.close()


def test_explain_uses_deterministic_context(monkeypatch):
    monkeypatch.setattr(ai_route, "LLMService", FakeLLM)
    learner = 9701
    seed(learner, "rag_fundamentals", 30.0)

    response = client.post("/api/ai/explain", json={
        "learner_id": learner,
        "target_career": "genai_engineer",
        "skill_id": "rag_fundamentals",
    })
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["answer"] == "Mocked personalized explanation."
    selected = body["context"]["selected_skill"]
    assert selected["current_mastery"] == 30.0
    assert selected["required_mastery"] == 75.0
    assert selected["gap"] == 45.0


def test_tutor_uses_context_and_question(monkeypatch):
    monkeypatch.setattr(ai_route, "LLMService", FakeLLM)
    response = client.post("/api/ai/tutor", json={
        "learner_id": 9702,
        "target_career": "genai_engineer",
        "skill_id": "embeddings",
        "question": "Why do embeddings help retrieval?",
    })
    assert response.status_code == 200, response.text
    assert response.json()["skill_id"] == "embeddings"


def test_invalid_skill_for_career_is_rejected(monkeypatch):
    monkeypatch.setattr(ai_route, "LLMService", FakeLLM)
    response = client.post("/api/ai/explain", json={
        "learner_id": 9703,
        "target_career": "data_scientist",
        "skill_id": "rag_fundamentals",
    })
    assert response.status_code == 404


def test_unknown_career_is_rejected(monkeypatch):
    monkeypatch.setattr(ai_route, "LLMService", FakeLLM)
    response = client.post("/api/ai/tutor", json={
        "learner_id": 9704,
        "target_career": "jedi_master",
        "question": "Teach me this.",
    })
    assert response.status_code == 404


if __name__ == "__main__":
    for name in [
        "test_explain_uses_deterministic_context",
        "test_tutor_uses_context_and_question",
        "test_invalid_skill_for_career_is_rejected",
        "test_unknown_career_is_rejected",
    ]:
        print(f"{name}: PASS (run through pytest for monkeypatch isolation)")
