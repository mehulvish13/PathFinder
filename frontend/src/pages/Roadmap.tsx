import { ModulePlaceholder } from "../components/common/ModulePlaceholder";

export default function Roadmap() {
  return (
    <ModulePlaceholder
      eyebrow="What to learn next"
      title="Learning Roadmap"
      description="The backend already produces a phased roadmap with milestones, estimated hours and a next action. This page will render it."
      phase="Phase 8C"
      capabilities={[
        "Render the backend roadmap phases and milestones",
        "Show per-skill mastery, gaps and matched resources",
        "Surface the backend-computed next action",
        "Support recalculation after an assessment",
      ]}
    />
  );
}
