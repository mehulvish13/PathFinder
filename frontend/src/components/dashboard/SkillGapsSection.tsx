import { Link } from "react-router-dom";
import { EmptyState } from "../common/EmptyState";
import {
  clampPercent,
  formatPercent,
  formatPoints,
  humanizeSkillId,
  importanceBadgeClass,
} from "../../utils/format";
import type { SkillGap } from "../../types/api";

interface SkillGapsSectionProps {
  gaps: SkillGap[];
  career: string | null;
}

/** Number of gaps shown before linking to the full Skills module. */
const PREVIEW_LIMIT = 6;

/**
 * Skill gaps computed by the backend gap engine (sorted by priority score).
 * The bars only visualize the backend's current/required mastery values —
 * the gap itself is never recalculated in React.
 */
export function SkillGapsSection({ gaps, career }: SkillGapsSectionProps) {
  if (gaps.length === 0) {
    return (
      <section className="card" aria-labelledby="skill-gaps-title">
        <div className="card__title" id="skill-gaps-title">
          Skill gaps
        </div>
        <EmptyState
          icon="◆"
          title="No skill gaps"
          message={
            career
              ? `Your mastery meets every requirement for ${career}.`
              : "Your mastery meets every requirement for your target career."
          }
        />
      </section>
    );
  }

  const preview = gaps.slice(0, PREVIEW_LIMIT);

  return (
    <section className="card" aria-labelledby="skill-gaps-title">
      <div className="section-header">
        <div>
          <div className="card__title" id="skill-gaps-title">
            Skill gaps
          </div>
          <div className="card__subtitle">
            Ranked by the backend priority score for {career ?? "your target career"}.
          </div>
        </div>
        <span className="badge badge--warning">{gaps.length} open</span>
      </div>

      <ul className="gap-list">
        {preview.map((gap) => (
          <li className="gap-item" key={gap.skill_id}>
            <div className="gap-item__head">
              <span className="gap-item__name">
                {humanizeSkillId(gap.skill_id)}
              </span>
              <span className={importanceBadgeClass(gap.importance)}>
                {gap.importance}
              </span>
            </div>

            <div
              className="gap-bar"
              role="img"
              aria-label={`${humanizeSkillId(gap.skill_id)}: ${formatPercent(
                gap.current_mastery,
              )} current mastery against ${formatPercent(
                gap.required_mastery,
              )} required`}
            >
              <div
                className="gap-bar__fill"
                style={{ width: `${clampPercent(gap.current_mastery)}%` }}
              />
              <div
                className="gap-bar__target"
                style={{ left: `${clampPercent(gap.required_mastery)}%` }}
              />
            </div>

            <div className="gap-item__meta">
              <span>Current {formatPercent(gap.current_mastery)}</span>
              <span>Required {formatPercent(gap.required_mastery)}</span>
              <span className="gap-item__gap">Gap {formatPoints(gap.gap)}</span>
              <span>Priority {gap.priority_score}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="row" style={{ justifyContent: "space-between", marginTop: 14 }}>
        <span className="subtle">
          Showing {preview.length} of {gaps.length} gaps
        </span>
        <Link className="button button--secondary" to="/skills">
          View all skills
        </Link>
      </div>
    </section>
  );
}
