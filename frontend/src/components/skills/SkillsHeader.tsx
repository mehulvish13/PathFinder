import { PageHeader } from "../common/PageHeader";

interface SkillsHeaderProps {
  /** Canonical career name returned by the backend, when available. */
  career: string | null;
  fallbackCareer: string;
  learnerId: number;
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Skills workspace header. The learner identity shown is the selection the
 * user already made in the app shell — no backend endpoint exposes a name.
 */
export function SkillsHeader({
  career,
  fallbackCareer,
  learnerId,
  refreshing,
  onRefresh,
}: SkillsHeaderProps) {
  return (
    <PageHeader
      eyebrow="What I know and what I need"
      title="Skills & Progress"
      description={
        career
          ? `Mastery measured against your ${career} requirements.`
          : `Mastery measured against your ${fallbackCareer} requirements.`
      }
      actions={
        <>
          <span className="badge badge--neutral">Learner #{learnerId}</span>
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
