import { useLearner } from "../../app/LearnerContext";
import { ConnectionStatus } from "../common/ConnectionStatus";
import type { AsyncState } from "../../hooks/useAsync";
import type { HealthResponse } from "../../types/api";

interface HeaderProps {
  title: string;
  health: AsyncState<HealthResponse>;
}

const CAREERS: Array<{ id: string; label: string }> = [
  { id: "genai_engineer", label: "GenAI Engineer" },
  { id: "ai_engineer", label: "AI Engineer" },
  { id: "ml_engineer", label: "ML Engineer" },
  { id: "data_scientist", label: "Data Scientist" },
  { id: "backend_developer", label: "Backend Developer" },
];

/**
 * Top bar. The learner id / target career here identify which backend data to
 * load; they do not perform any calculation in the frontend.
 */
export function Header({ title, health }: HeaderProps) {
  const {
    learnerId,
    setLearnerId,
    targetCareer,
    setTargetCareer,
    hoursPerWeek,
    setHoursPerWeek,
  } = useLearner();

  return (
    <header className="header">
      <div className="header__title">{title}</div>

      <div className="header__controls">
        <ConnectionStatus health={health} />

        <label className="field-inline">
          Learner
          <input
            type="number"
            min={1}
            value={learnerId}
            aria-label="Active learner id"
            onChange={(e) => setLearnerId(Number(e.target.value))}
            style={{ width: 64 }}
          />
        </label>

        <label className="field-inline">
          Career
          <select
            value={targetCareer}
            aria-label="Target career"
            onChange={(e) => setTargetCareer(e.target.value)}
          >
            {CAREERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-inline">
          Hrs/week
          <input
            type="number"
            min={1}
            value={hoursPerWeek}
            aria-label="Hours per week"
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            style={{ width: 56 }}
          />
        </label>
      </div>
    </header>
  );
}
