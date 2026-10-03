import { StatCard } from "../common/StatCard";
import { formatPercent } from "../../utils/format";

interface SkillsOverviewProps {
  tracked: number;
  mastered: number;
  openGaps: number;
  overallProgress: number | null;
  completedResources: number | null;
  totalResources: number | null;
}

/**
 * Overview counts. Every number is a backend value or a direct count of
 * backend records — no thresholds or classifications are invented here.
 */
export function SkillsOverview({
  tracked,
  mastered,
  openGaps,
  overallProgress,
  completedResources,
  totalResources,
}: SkillsOverviewProps) {
  return (
    <div className="grid grid--4">
      <StatCard
        label="Tracked skills"
        value={tracked}
        hint="Skills with backend mastery or gap data"
      />
      <StatCard
        label="Mastered"
        value={mastered}
        hint="Mastery meets the career requirement"
      />
      <StatCard
        label="Open gaps"
        value={openGaps}
        hint="Below the required mastery"
      />
      <StatCard
        label="Overall progress"
        value={overallProgress != null ? formatPercent(overallProgress) : "—"}
        hint={
          completedResources != null && totalResources != null
            ? `${completedResources} of ${totalResources} resources completed`
            : "Progress data unavailable"
        }
      />
    </div>
  );
}
