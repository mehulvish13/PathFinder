import { Link } from "react-router-dom";
import { EmptyState } from "../common/EmptyState";
import {
  clampPercent,
  formatPercent,
  formatPoints,
  humanizeSkillId,
  importanceBadgeClass,
  readinessBadgeClass,
} from "../../utils/format";
import type { Recommendation } from "../../types/api";

interface CurrentFocusCardProps {
  /** Backend's top-priority recommendation, when one exists. */
  focus: Recommendation | null;
  /** Backend progress next-action string, when it is actionable. */
  activity: string | null;
  /** Canonical career name from the backend (used by the empty state). */
  career: string | null;
}

/**
 * "Current learning state" — renders the skill the backend ranks first.
 * Mastery/target/gap are backend fields; the bar is a visual mapping of them.
 */
export function CurrentFocusCard({ focus, activity, career }: CurrentFocusCardProps) {
  if (!focus) {
    return (
      <section className="card" aria-labelledby="current-focus-title">
        <div className="card__title" id="current-focus-title">
          Current focus
        </div>
        <EmptyState
          icon="✓"
          title="No open skill gaps"
          message={
            career
              ? `You meet every requirement for your ${career} path.`
              : "You meet every requirement for your target career."
          }
        />
      </section>
    );
  }

  const current = clampPercent(focus.current_mastery);
  const target = clampPercent(focus.required_mastery);

  return (
    <section className="card" aria-labelledby="current-focus-title">
      <div className="section-header">
        <div>
          <div className="card__title" id="current-focus-title">
            Current focus
          </div>
          <div className="card__subtitle">
            Top-priority skill from the backend recommendation engine.
          </div>
        </div>
        <div className="row">
          <span className={importanceBadgeClass(focus.importance)}>
            {focus.importance} importance
          </span>
          <span className={readinessBadgeClass(focus.readiness)}>
            {focus.readiness}
          </span>
        </div>
      </div>

      <div className="focus-skill-name">{humanizeSkillId(focus.skill_id)}</div>

      <div
        className="gap-bar"
        role="img"
        aria-label={`${humanizeSkillId(focus.skill_id)}: ${formatPercent(
          focus.current_mastery,
        )} current mastery against ${formatPercent(focus.required_mastery)} required`}
      >
        <div className="gap-bar__fill" style={{ width: `${current}%` }} />
        <div className="gap-bar__target" style={{ left: `${target}%` }} />
      </div>

      <div className="focus-grid">
        <div className="metric">
          <div className="metric__label">Current mastery</div>
          <div className="metric__value">{formatPercent(focus.current_mastery)}</div>
        </div>
        <div className="metric">
          <div className="metric__label">Target mastery</div>
          <div className="metric__value">{formatPercent(focus.required_mastery)}</div>
        </div>
        <div className="metric">
          <div className="metric__label">Gap</div>
          <div className="metric__value">{formatPoints(focus.gap)}</div>
        </div>
      </div>

      <div className="focus-activity">
        <span className="metric__label">Current activity</span>
        <span>{activity ?? "No active resource"}</span>
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <Link className="button" to="/roadmap">
          Continue Learning
        </Link>
      </div>
    </section>
  );
}
