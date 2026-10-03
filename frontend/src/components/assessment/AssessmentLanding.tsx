import { PageHeader } from "../common/PageHeader";
import { humanizeSkillId } from "../../utils/format";
import type { Recommendation } from "../../types/api";

interface AssessmentLandingProps {
  options: Recommendation[];
  skillId: string;
  numQuestions: number;
  starting: boolean;
  startError: string | null;
  career: string | null;
  onSkillChange: (skillId: string) => void;
  onNumQuestionsChange: (n: number) => void;
  onStart: () => void;
}

const QUESTION_CHOICES = [3, 5, 10];

/**
 * Assessment entry: skill + question-count selection. The skill list is the
 * backend's open-gap recommendations — skills worth validating. Whether a
 * quiz actually exists is decided by the backend at start time (honest 404
 * when a skill has no bank yet).
 */
export function AssessmentLanding({
  options,
  skillId,
  numQuestions,
  starting,
  startError,
  career,
  onSkillChange,
  onNumQuestionsChange,
  onStart,
}: AssessmentLandingProps) {
  const selected = options.find((rec) => rec.skill_id === skillId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Validate mastery"
        title="Take Assessment"
        description={
          career
            ? `Prove your mastery and watch your ${career} path adapt.`
            : "Prove your mastery and watch your learning path adapt."
        }
      />

      <section className="card" aria-labelledby="assessment-setup-title">
        <div className="card__title" id="assessment-setup-title">
          Choose your assessment
        </div>
        <p className="card__subtitle">
          Answers are scored by the backend; unanswered questions count as
          incorrect. A high score raises mastery and recalculates your roadmap.
        </p>

        {options.length === 0 ? (
          <p className="subtle" style={{ marginTop: 12 }}>
            No open skill gaps to assess right now — you're caught up.
          </p>
        ) : (
          <div className="form-grid" style={{ marginTop: 14 }}>
            <label className="form-field">
              <span className="metric__label">Skill</span>
              <select
                className="input"
                value={skillId}
                onChange={(event) => onSkillChange(event.target.value)}
                disabled={starting}
              >
                {options.map((rec) => (
                  <option key={rec.skill_id} value={rec.skill_id}>
                    {humanizeSkillId(rec.skill_id)}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-field">
              <span className="metric__label">Questions</span>
              <div className="row" role="group" aria-label="Number of questions">
                {QUESTION_CHOICES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={
                      "button button--secondary button--small" +
                      (numQuestions === n ? " button--active" : "")
                    }
                    aria-pressed={numQuestions === n}
                    disabled={starting}
                    onClick={() => onNumQuestionsChange(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selected ? (
          <p className="subtle" style={{ marginTop: 12 }}>
            Current mastery {selected.current_mastery}% · target{" "}
            {selected.required_mastery}% · {selected.importance} importance.
            Passing well moves mastery toward the target.
          </p>
        ) : null}

        {startError ? (
          <div className="notice notice--error" role="alert" style={{ marginTop: 12 }}>
            {startError}
          </div>
        ) : null}

        <div className="row" style={{ marginTop: 14 }}>
          <button
            type="button"
            className="button"
            disabled={starting || options.length === 0}
            onClick={onStart}
          >
            {starting ? "Starting…" : "Start Assessment"}
          </button>
        </div>
      </section>
    </>
  );
}
