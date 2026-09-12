import json
import os
from pathlib import Path

# Load .env if present — do not fail if missing (so tests without key still import)
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parents[3] / ".env"
    if _env_path.exists():
        load_dotenv(dotenv_path=_env_path)
    else:
        # also try backend/.env relative to cwd fallback
        load_dotenv()
except Exception:
    pass


class LLMService:
    """
    LLM Service — Gemini provider.
    INTERVIEW PREP: See backend/docs/INTERVIEW_PREP_COMMIT3.md — LLM Service section
    Q: Why profile extraction only, not path generation? / How to swap provider? / Why lazy import?

    Architecture:
        API → LLMService.extract_learner_profile() → Pydantic LearnerProfile validation

    The AI does NOT decide the learning path — it only extracts the profile.
    Deterministic engine (gap/prereq/priority) builds the path afterwards.

    Swap provider (Groq) by replacing __init__/extract without touching callers.
    """

    def __init__(self, model: str = "gemini-2.5-flash"):
        api_key = os.getenv("GEMINI_API_KEY")  # INTERVIEW: .env + .gitignore keeps secrets out of git
        if not api_key or api_key.strip() in ("", "your_api_key_here"):
            raise ValueError(
                "GEMINI_API_KEY is not configured. Set it in backend/.env "
                "(see backend/.env — never commit the key)."
            )
        # INTERVIEW: Lazy import — allows `import LLMService` in tests without google-genai installed
        # Lazy import so module imports without google-genai installed still work for tests
        try:
            from google import genai  # type: ignore
        except ImportError as e:
            raise ImportError(
                "google-genai is not installed. Run: pip install google-genai"
            ) from e
        self._genai = genai
        self.client = genai.Client(api_key=api_key)
        self.model = model

    def extract_learner_profile(
        self,
        user_message: str,
        available_skills: list,
        available_careers: list,
    ) -> dict:
        skills_text = "\n".join(
            f"{s['id']}: {s['name']}" for s in available_skills
        )
        careers_text = "\n".join(
            f"{c['id']}: {c['name']}" for c in available_careers
        )

        prompt = f"""
You are the learner profiling component of PathFinder,
an AI-powered personalized learning path recommender.

Extract structured learner information from the user's message.

AVAILABLE CAREERS:
{careers_text}

AVAILABLE SKILLS:
{skills_text}

USER MESSAGE:
{user_message}

Rules:

1. Only use skill IDs from the available skills.
2. Only use career IDs from the available careers.
3. Estimate mastery from 0 to 100.
4. If the user provides insufficient evidence for a skill,
   do not invent it.
5. Confidence must be between 0 and 1.
6. If information is missing, use null or an empty list.
7. Return ONLY valid JSON.

Return this structure:

{{
    "name": null,
    "target_career": "",
    "goal_description": "",
    "experience_level": "",
    "skills": [
        {{
            "skill_id": "",
            "mastery": 0,
            "confidence": 0.5
        }}
    ],
    "completed_courses": [],
    "completed_projects": [],
    "interests": [],
    "hours_per_week": null,
    "deadline": null,
    "learning_preference": null
}}
"""

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )

        text = (response.text or "").strip()

        # INTERVIEW: Gemini sometimes wraps JSON in ```json fences — strip before json.loads
        if text.startswith("```"):
            text = text.replace("```json", "")
            text = text.replace("```", "")
            text = text.strip()

        return json.loads(text)
