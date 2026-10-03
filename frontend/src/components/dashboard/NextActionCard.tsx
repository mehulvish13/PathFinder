import { Link } from "react-router-dom";
import { EmptyState } from "../common/EmptyState";
import {
  formatAction,
  formatPercent,
  formatPoints,
  humanizeSkillId,
  importanceBadgeClass,
} from "../../utils/format";
import type { Dashboard, Recommendation } from "../../types/api";

interface NextActionCardProps {
  /** Action derived from the learner's progress (GET /api/progress/dashboard). */
  progressAction: string | null;
  /** Action derived from the backend roadmap (POST /api/adaptation/recalculate). */
  roadmapAction: string | null;
  /** Backend's top-priority recommendation, used as context for the roadmap action. */
  focus: Recommendation | null;
  /** Dashboard payload, used as context for the progress action. */
  progress: Dashboard;
  career: string | null;
}

/**
 * The dashboard's primary "what do I do now" card. Both candidate actions are
 * backend strings — the card only chooses which one to show and adds backend
 * context (mastery/gap/importance or resource counts).
 */
export function NextActionCard({
  progressAction,
  roadmapAction,
  focus,
  progress,
  career,
}: NextActionCardProps) {
  const primary = progressAction ?? roadmapAction;
  const queued =
    primary && progressAction && roadmapAction && primary !== roadmapAction
      ? roadmapAction
      : null;

  if (!primary) {
    return (
      <section className="card card--featured" aria-labelledby="next-action-title">
        <div className="page-header__eyebrow" id="next-action-title">
          Next action
        </div>
        <EmptyState
          icon="✓"
          title="You're currently caught up."
          message="The backend has no pending action for this learner right now."
        />
      </section>
    );
  }

  const fromRoadmap = primary === roadmapAction;

  return (
    <section className="card card--featured" aria-labelledby="next-action-title">
      <div className="section-header">
        <div>
          <div className="page-header__eyebrow" id="next-action-title">
            Next action
          </div>
          <div className="next-action__title">{formatAction(primary)}</div>
        </div>
        <Link className="button" to="/roadmap">
          {fromRoadmap ? "Start Learning" : "Continue"}
        </Link>
      </div>

      {fromRoadmap && focus ? (
        <>
          <div className="focus-grid focus-grid--tight">
            <div className="metric">
              <div className="metric__label">Current mastery</div>
              <div className="metric__value">
                {formatPercent(focus.current_mastery)}
              </div>
            </div>
            <div className="metric">
              <div className="metric__label">Target mastery</div>
              <div className="metric__value">
                {formatPercent(focus.required_mastery)}
              </div>
            </div>
            <div className="metric">
              <div className="metric__label">Gap</div>
              <div className="metric__value">{formatPoints(focus.gap)}</div>
            </div>
          </div>

          <div className="next-action__why">
            <span className="metric__label">Why this matters</span>
            <span>
              Required for your {career ?? "target career"} path ·{" "}
              <span className={importanceBadgeClass(focus.importance)}>
                {focus.importance}
              </span>{" "}
              importance for {humanizeSkillId(focus.skill_id)}.
            </span>
          </div>
        </>
      ) : (
        Number.isFinite(progress.total_resources) && (
          <div className="next-action__why">
            <span className="metric__label">Progress context</span>
            <span>
              {progress.completed_resources} of {progress.total_resources} resources
              completed · {formatPercent(progress.overall_progress)} overall ·{" "}
              {progress.in_progress_resources} in progress.
            </span>
          </div>
        )
      )}

      {queued ? (
        <p className="subtle" style={{ marginTop: 10 }}>
          Then: {formatAction(queued)}
        </p>
      ) : null}
    </section>
  );
}
