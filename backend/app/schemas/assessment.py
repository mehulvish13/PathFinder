# INTERVIEW PREP: See backend/docs/INTERVIEW_PREP_COMMIT5.md — Assessment section (planned)
# Q: Why hide correct answers at start? / Why blend mastery 30/70? / Why gap_before/gap_after in result?
from pydantic import BaseModel, Field
from typing import List, Optional


class AssessmentStartRequest(BaseModel):
    learner_id: int
    skill_id: str
    num_questions: int = Field(default=5, ge=1, le=10)  # INTERVIEW: bounded so one skill quiz stays a quick check, not an exam
    required_mastery: float = Field(default=70.0, ge=0, le=100)  # INTERVIEW: same V1 default as progress API; caller may pass career-specific target


class AnswerItem(BaseModel):
    question_id: str
    selected_index: int = Field(ge=0)  # INTERVIEW: upper bound checked against actual options in service (varies per question)


class AssessmentSubmitRequest(BaseModel):
    assessment_id: int
    answers: List[AnswerItem] = Field(default_factory=list)  # INTERVIEW: missing answers count as incorrect — lenient for partial UI submits


class QuestionPublic(BaseModel):
    # INTERVIEW: no correct_index/explanation-of-answer here — start response must never leak the key
    question_id: str
    skill_id: str
    question: str
    options: List[str]
    difficulty: str


class QuestionFeedback(BaseModel):
    question_id: str
    correct: bool
    selected_index: Optional[int] = None
    correct_index: int
    explanation: str


class AssessmentStartResponse(BaseModel):
    assessment_id: int
    learner_id: int
    skill_id: str
    num_questions: int
    questions: List[QuestionPublic]

    class Config:
        from_attributes = True


class AssessmentResultResponse(BaseModel):
    # INTERVIEW: gap_before/gap_after is the adaptive-loop proof — same required target, mastery moved, gap shrank
    assessment_id: int
    learner_id: int
    skill_id: str
    correct: int
    incorrect: int
    total: int
    percentage: float
    previous_mastery: float
    new_mastery: float
    required_mastery: float
    gap_before: float
    gap_after: float
    status: str  # ready | needs_work
    feedback: List[QuestionFeedback] = Field(default_factory=list)

    class Config:
        from_attributes = True


class AssessmentDetailResponse(BaseModel):
    assessment_id: int
    learner_id: int
    skill_id: str
    status: str  # started | submitted
    num_questions: int
    questions: List[QuestionPublic]
    percentage: Optional[float] = None
    submitted_at: Optional[str] = None

    class Config:
        from_attributes = True
