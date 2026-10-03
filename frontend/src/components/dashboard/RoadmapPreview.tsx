import { Link } from "react-router-dom";
import { EmptyState } from "../common/EmptyState";
import { formatHours, humanizeSkillId } from "../../utils/format";
import type { Roadmap } from "../../types/api";

interface RoadmapPreviewProps {
  roadmap: Roadmap | null;
  hoursPerWeek: number;
}

/**
 * Compact dashboard preview of the backend roadmap: totals, the current
 * (first) phase with its milestone, and a phase strip. The full roadmap page
 * belongs to Phase 8C — this only previews it and links there.
 */
export function RoadmapPreview({ roadmap, hoursPerWeek }: RoadmapPreviewProps) {
  const phases = Array.isArray(roadmap?.phases) ? roadmap.phases : [];

  if (!roadmap || phases.length === 0) {
    return (
      <section className="card" aria-labelledby="roadmap-preview-title">
        <div className="card__title" id="roadmap-preview-title">
          Current roadmap
        </div>
        <EmptyState
          icon="◈"
          title="No roadmap yet"
          message="A roadmap is generated from your target career and current mastery."
        />
      </section>
    );
  }

  const current = phases[0];

  return (
    <section className="card" aria-labelledby="roadmap-preview-title">
      <div className="section-header">
        <div>
          <div className="card__title" id="roadmap-preview-title">
            Current roadmap
          </div>
          <div className="card__subtitle">{roadmap.title}</div>
        </div>
        <span className="badge badge--info">{phases.length} phases</span>
      </div>

      <div className="roadmap-meta">
        <div className="metric">
          <div className="metric__label">Total effort</div>
          <div className="metric__value">{formatHours(roadmap.total_estimated_hours)}</div>
        </div>
        <div className="metric">
          <div className="metric__label">Estimated duration</div>
          <div className="metric__value">
            {roadmap.estimated_weeks != null
              ? `${roadmap.estimated_weeks} weeks`
              : "—"}
          </div>
          <div className="metric__hint">at {hoursPerWeek} h/week</div>
        </div>
      </div>

      <div className="phase-current">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="badge badge--success">
            Current · {current.title} of {phases.length}
          </span>
          <span className="subtle">{formatHours(current.estimated_hours)}</span>
        </div>
        <div className="phase-current__title">{current.milestone.title}</div>
        <p className="card__subtitle">{current.milestone.description}</p>
        <div className="row" style={{ marginTop: 8 }}>
          {current.skills.slice(0, 6).map((skill) => (
            <span className="chip" key={skill.skill_id}>
              {humanizeSkillId(skill.skill_id)}
            </span>
          ))}
          {current.skills.length > 6 ? (
            <span className="subtle">+{current.skills.length - 6} more</span>
          ) : null}
        </div>
      </div>

      <div className="phase-strip" aria-label="Roadmap phases">
        {phases.map((phase, index) => (
          <span
            key={phase.id}
            className={
              "phase-chip" + (index === 0 ? " phase-chip--current" : "")
            }
            title={phase.milestone.title}
          >
            {index + 1} · {formatHours(phase.estimated_hours)}
          </span>
        ))}
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <Link className="button button--secondary" to="/roadmap">
          View Full Roadmap
        </Link>
      </div>
    </section>
  );
}
