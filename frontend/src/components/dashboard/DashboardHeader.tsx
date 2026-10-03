import { PageHeader } from "../common/PageHeader";

interface DashboardHeaderProps {
  /** Canonical career name returned by the backend, when available. */
  career: string | null;
  learnerId: number;
  hoursPerWeek: number;
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Welcome / learner context strip. The name falls back to "Welcome back"
 * because no backend endpoint exposes a learner name yet — nothing here is
 * hardcoded beyond the learner selection the user already made in the header.
 */
export function DashboardHeader({
  career,
  learnerId,
  hoursPerWeek,
  refreshing,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <PageHeader
      eyebrow="Your learning journey"
      title="Welcome back"
      description={
        career
          ? `Your personalized path toward ${career}.`
          : "Your personalized learning journey."
      }
      actions={
        <>
          <span className="badge badge--neutral">Learner #{learnerId}</span>
          <span className="badge badge--neutral">{hoursPerWeek} h/week</span>
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
