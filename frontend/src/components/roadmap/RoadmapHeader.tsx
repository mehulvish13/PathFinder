import { PageHeader } from "../common/PageHeader";
import { formatHours } from "../../utils/format";

interface RoadmapHeaderProps {
  /** Canonical career name returned by the backend, when available. */
  career: string | null;
  /** Career id the learner selected (fallback when backend has not answered). */
  fallbackCareer: string;
  hoursPerWeek: number;
  totalHours: number | null;
  estimatedWeeks: number | null;
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Roadmap header + learner context. All values are backend-derived; the career
 * falls back to the learner's selection only until the backend answers.
 */
export function RoadmapHeader({
  career,
  fallbackCareer,
  hoursPerWeek,
  totalHours,
  estimatedWeeks,
  refreshing,
  onRefresh,
}: RoadmapHeaderProps) {
  const title = career ?? fallbackCareer;
  const details: string[] = [`${hoursPerWeek} h/week`];
  if (totalHours != null) details.push(`${formatHours(totalHours)} total`);
  if (estimatedWeeks != null) details.push(`~${estimatedWeeks} weeks`);

  return (
    <PageHeader
      eyebrow="What to learn next"
      title={`Your Path to ${title}`}
      description="Personalized learning roadmap, generated from your current mastery and target career."
      actions={
        <>
          <span className="badge badge--neutral">{details.join(" · ")}</span>
          <button
            type="button"
            className="button button--secondary"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </>
      }
    />
  );
}
