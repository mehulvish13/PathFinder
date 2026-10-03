import { StatCard } from "../common/StatCard";
import { formatHours, formatPercent } from "../../utils/format";
import type { Dashboard } from "../../types/api";

/**
 * Summary cards. Every value comes straight from
 * GET /api/progress/dashboard/{learner_id} — no derived percentages.
 */
export function SummaryCards({ data }: { data: Dashboard }) {
  const mastery = Array.isArray(data.skill_mastery) ? data.skill_mastery : [];
  const tracked = mastery.length;
  const atTarget = mastery.filter((s) => s.status === "ready").length;

  return (
    <div className="grid grid--4">
      <StatCard
        label="Overall progress"
        value={formatPercent(data.overall_progress)}
        hint={
          data.total_resources > 0
            ? `${data.completed_resources} of ${data.total_resources} resources completed`
            : "No resources started yet"
        }
      />
      <StatCard
        label="Skills at target"
        value={tracked > 0 ? `${atTarget}/${tracked}` : "—"}
        hint={
          tracked > 0
            ? `${tracked - atTarget} still below target mastery`
            : "No mastery recorded yet"
        }
      />
      <StatCard
        label="Time remaining"
        value={formatHours(data.estimated_time_remaining)}
        hint="Estimated hours across unfinished resources"
      />
      <StatCard
        label="In progress"
        value={data.in_progress_resources}
        hint={`${data.not_started_resources} not started`}
      />
    </div>
  );
}
