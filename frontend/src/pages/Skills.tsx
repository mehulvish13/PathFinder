import { ModulePlaceholder } from "../components/common/ModulePlaceholder";

export default function Skills() {
  return (
    <ModulePlaceholder
      eyebrow="What I know and what I need"
      title="Skills & Progress"
      description="Skill mastery and gaps are computed by the backend skill-gap engine. This page will present them."
      phase="Phase 8D"
      capabilities={[
        "List current skill mastery from GET /api/progress/{id}/skills",
        "Show gaps and target mastery supplied by the backend",
        "Track milestone history over time",
        "Filter and sort by readiness and importance",
      ]}
    />
  );
}
