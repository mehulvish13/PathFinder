import { humanizeSkillId } from "../../utils/format";
import type { QuestionPublic } from "../../types/api";

interface AssessmentSessionProps {
  skillId: string;
  questions: QuestionPublic[];
  index: number;
  answers: Map<string, number>;
  submitting: boolean;
  submitError: string | null;
  confirming: boolean;
  onSelect: (questionId: string, optionIndex: number) => void;
  onNavigate: (index: number) => void;
  onRequestSubmit: () => void;
  onCancelConfirm: () => void;
  onConfirmSubmit: () => void;
  onAbandon: () => void;
}

/**
 * One-question-at-a-time session with prev/next navigation, an answered
 * progress indicator and a guarded submit (unanswered questions are named
 * before anything is sent — the backend would mark them incorrect).
 */
export function AssessmentSession({
  skillId,
  questions,
  index,
  answers,
  submitting,
  submitError,
  confirming,
  onSelect,
  onNavigate,
  onRequestSubmit,
  onCancelConfirm,
  onConfirmSubmit,
  onAbandon,
}: AssessmentSessionProps) {
  const question = questions[index];
  const answered = questions.filter((q) => answers.has(q.question_id)).length;
  const unanswered = questions.filter((q) => !answers.has(q.question_id));

  if (!question) return null;

  return (
    <section className="card" aria-labelledby="assessment-session-title">
      <div className="section-header">
        <div>
          <div className="card__title" id="assessment-session-title">
            {humanizeSkillId(skillId)}
          </div>
          <div className="card__subtitle">
            Question {index + 1} of {questions.length} · {answered} answered
          </div>
        </div>
        <span className="badge badge--info">{question.difficulty}</span>
      </div>

      <div
        className="answer-progress"
        role="img"
        aria-label={`${answered} of ${questions.length} questions answered`}
      >
        <div
          className="answer-progress__fill"
          style={{ width: `${(answered / questions.length) * 100}%` }}
        />
      </div>

      <fieldset className="question-block">
        <legend className="question-text">{question.question}</legend>
        <div className="option-list">
          {question.options.map((option, optionIndex) => {
            const checked = answers.get(question.question_id) === optionIndex;
            return (
              <label
                key={optionIndex}
                className={"option" + (checked ? " option--selected" : "")}
              >
                <input
                  type="radio"
                  name={question.question_id}
                  checked={checked}
                  disabled={submitting}
                  onChange={() => onSelect(question.question_id, optionIndex)}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="question-nav">
        {questions.map((q, qIndex) => (
          <button
            key={q.question_id}
            type="button"
            className={
              "question-dot" +
              (qIndex === index ? " question-dot--current" : "") +
              (answers.has(q.question_id) ? " question-dot--answered" : "")
            }
            aria-label={`Go to question ${qIndex + 1}${answers.has(q.question_id) ? " (answered)" : " (unanswered)"}`}
            aria-current={qIndex === index ? "true" : undefined}
            disabled={submitting}
            onClick={() => onNavigate(qIndex)}
          >
            {qIndex + 1}
          </button>
        ))}
      </div>

      {submitError ? (
        <div className="notice notice--error" role="alert" style={{ marginTop: 12 }}>
          {submitError}
        </div>
      ) : null}

      {confirming ? (
        <div className="confirm-panel" role="alertdialog" aria-labelledby="confirm-title">
          <div className="card__title" id="confirm-title">
            Submit assessment?
          </div>
          {unanswered.length > 0 ? (
            <p className="card__subtitle">
              {unanswered.length} question{unanswered.length === 1 ? "" : "s"}{" "}
              unanswered — the backend marks them incorrect.
            </p>
          ) : (
            <p className="card__subtitle">
              All questions answered. This cannot be undone.
            </p>
          )}
          <div className="row" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="button"
              disabled={submitting}
              onClick={onConfirmSubmit}
            >
              {submitting ? "Submitting…" : "Submit Answers"}
            </button>
            <button
              type="button"
              className="button button--secondary"
              disabled={submitting}
              onClick={onCancelConfirm}
            >
              Keep Answering
            </button>
          </div>
        </div>
      ) : (
        <div className="row row--spread" style={{ marginTop: 14 }}>
          <div className="row">
            <button
              type="button"
              className="button button--secondary"
              disabled={index === 0 || submitting}
              onClick={() => onNavigate(index - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="button button--secondary"
              disabled={index === questions.length - 1 || submitting}
              onClick={() => onNavigate(index + 1)}
            >
              Next
            </button>
          </div>
          <div className="row">
            <button
              type="button"
              className="button button--secondary"
              disabled={submitting}
              onClick={onAbandon}
            >
              Abandon
            </button>
            <button
              type="button"
              className="button"
              disabled={submitting}
              onClick={onRequestSubmit}
            >
              Review & Submit
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
