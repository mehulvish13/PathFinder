import { Link } from "react-router-dom";
import { EmptyState } from "../common/EmptyState";
import {
  formatPercent,
  formatPoints,
  humanizeSkillId,
} from "../../utils/format";
import type { AssessmentResult, QuestionPublic } from "../../types/api";

interface AssessmentResultProps {
  result: AssessmentResult;
  questions: QuestionPublic[];
  career: string | null;
  onRetake: () => void;
  onNewSkill: () => void;
}

/**
 * Scored result, rendered entirely from the backend submit response:
 * score, mastery before/after, gap before/after, per-question feedback and
 * the adaptation the backend computed in the same call.
 */
export function AssessmentResultView({
  result,
  questions,
  career,
  onRetake,
  onNewSkill,
}: AssessmentResultProps) {
  const mastered = result.status === "ready";
  const clearedThisSkill =
    result.adaptation?.cleared_skills?.includes(result.skill_id) ?? false;
  const questionById = new Map(questions.map((q) => [q.question_id, q]));

  return (
    <>
      <section className="card card--featured" aria-labelledby="result-title">
        <div className="page-header__eyebrow" id="result-title">
          Assessment result
        </div>
        <div className="result-score">
          <span className="result-score__value">
            {formatPercent(result.percentage)}
          </span>
          <span className="subtle">
            {result.correct} correct · {result.incorrect} incorrect ·{" "}
            {result.total} questions
          </span>
        </div>

        <div className="result-skill">{humanizeSkillId(result.skill_id)}</div>

        <div className="before-after">
          <div className="before-after__col">
            <span className="metric__label">Before</span>
            <span>
              Mastery {formatPercent(result.previous_mastery)} · Gap{" "}
              {formatPoints(result.gap_before)}
            </span>
          </div>
          <div className="before-after__arrow" aria-hidden="true">
            →
          </div>
          <div className="before-after__col">
            <span className="metric__label">After</span>
            <span>
              Mastery {formatPercent(result.new_mastery)} · Gap{" "}
              {formatPoints(result.gap_after)}
            </span>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <span className={mastered ? "badge badge--success" : "badge badge--warning"}>
            {mastered ? "✓ Skill mastered" : "Needs work"}
          </span>
          {result.adaptation ? (
            <span className="badge badge--info">✓ Learning path updated</span>
          ) : null}
          {result.adaptation ? (
            <span className="badge badge--info">✓ Roadmap recalculated</span>
          ) : null}
          {clearedThisSkill ? (
            <span className="badge badge--success">✓ Cleared from active gaps</span>
          ) : null}
        </div>

        {result.adaptation?.roadmap?.next_action ? (
          <p className="subtle" style={{ marginTop: 10 }}>
            Next up: {result.adaptation.roadmap.next_action}
            {career ? ` on your ${career} path.` : "."}
          </p>
        ) : null}

        <div className="row" style={{ marginTop: 14 }}>
          <Link className="button" to="/roadmap">
            View Updated Roadmap
          </Link>
          <Link className="button button--secondary" to="/skills">
            View Skills
          </Link>
          <Link className="button button--secondary" to="/dashboard">
            Back to Dashboard
          </Link>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={onRetake}
          >
            Retake Assessment
          </button>
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={onNewSkill}
          >
            Assess Another Skill
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="feedback-title">
        <div className="card__title" id="feedback-title">
          Question feedback
        </div>
        <div className="card__subtitle">
          Scored by the backend — correct answers revealed only after submit.
        </div>
        {result.feedback.length === 0 ? (
          <div style={{ marginTop: 12 }}>
            <EmptyState
              icon="○"
              title="No per-question feedback"
              message="The backend returned a score without item feedback for this attempt."
            />
          </div>
        ) : (
          <ul className="feedback-list">
            {result.feedback.map((item) => {
              const question = questionById.get(item.question_id);
              const picked = item.selected_index;
              return (
                <li
                  key={item.question_id}
                  className={
                    "feedback-item" +
                    (item.correct ? " feedback-item--correct" : " feedback-item--wrong")
                  }
                >
                  <div className="feedback-item__head">
                    <span className={item.correct ? "badge badge--success" : "badge badge--danger"}>
                      {item.correct ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  </div>
                  {question ? (
                    <p className="feedback-item__question">{question.question}</p>
                  ) : null}
                  {question ? (
                    <ul className="feedback-options">
                      {question.options.map((option, optionIndex) => (
                        <li
                          key={optionIndex}
                          className={
                            "feedback-option" +
                            (optionIndex === item.correct_index
                              ? " feedback-option--correct"
                              : "") +
                            (picked === optionIndex && !item.correct
                              ? " feedback-option--picked"
                              : "")
                          }
                        >
                          {option}
                          {optionIndex === item.correct_index ? " ✓" : ""}
                          {picked === optionIndex && !item.correct ? " (your answer)" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="subtle">{item.explanation}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
