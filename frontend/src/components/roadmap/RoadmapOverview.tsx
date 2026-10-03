import { StatCard } from "../common/StatCard";
import { formatHours, formatPercent, humanizeSkillId } from "../../utils/format";
import type { AdaptationResult, Dashboard } from "../../types/api";

interface RoadmapOverviewProps {
  path: AdaptationResult;
  /** Dashboard payload is optional: the roadmap renders without it. */
  progress: Dashboard | null;
}

/**
 * Compact overview built only from backend-supplied numbers. Phase completion
 * is intentionally absent — the backend exposes no per-phase completion state,
 * so the page never invents it.
 */
export function RoadmapOverview({ path, progress }: RoadmapOverviewProps) {
  const phases = Array.isArray(path.roadmap?.phases) ? path.roadmap.phases : [];
  const cleared = Array.isArray(path.cleared_skills) ? path.cleared_skills : [];
  const totals = path.learning_path;

  return (
    <>
      <div className="grid grid--4">
        <StatCard
          label="Phases"
          value={phases.length}
          hint={
            phases.length > 0
              ? "Phase 1 is your current phase"
              : "No phases generated yet"
          }
        />
        <StatCard
          label="Skills in path"
          value={totals.total_skills}
          hint={`${totals.ready_skills} ready · ${totals.blocked_skills} blocked`}
        />
        <StatCard
          label="Estimated duration"
          value={
            path.roadmap?.estimated_weeks != null
              ? `${path.roadmap.estimated_weeks} weeks`
              : formatHours(path.roadmap?.total_estimated_hours)
          }
          hint={`${formatHours(path.roadmap?.total_estimated_hours)} of curated work`}
        />
        <StatCard
          label="Overall progress"
          value={
            progress ? formatPercent(progress.overall_progress) : "—"
          }
          hint={
            progress
              ? `${progress.completed_resources} of ${progress.total_resources} resources completed`
              : "Progress data unavailable"
          }
        />
      </div>

      {cleared.length > 0 ? (
        <section className="card" aria-labelledby="mastered-title">
          <div className="section-header">
            <div>
              <div className="card__title" id="mastered-title">
                Already mastered
              </div>
              <div className="card__subtitle">
                Skills where your mastery meets the career requirement.
              </div>
            </div>
            <span className="badge badge--success">{cleared.length}</span>
          </div>
          <div className="row">
            {cleared.map((skillId) => (
              <span className="chip chip--done" key={skillId}>
                ✓ {humanizeSkillId(skillId)}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
