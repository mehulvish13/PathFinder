import { ModulePlaceholder } from "../components/common/ModulePlaceholder";

export default function Tutor() {
  return (
    <ModulePlaceholder
      eyebrow="Understand and learn"
      title="AI Tutor"
      description="The backend AI tutor explains the learner's state and answers questions grounded in PathFinder context. This page will host that conversation."
      phase="Phase 8F"
      capabilities={[
        "Explain a selected skill via POST /api/ai/explain",
        "Ask follow-up questions via POST /api/ai/tutor",
        "Show the deterministic context the answer is grounded in",
        "Keep mastery and roadmap decisions on the backend",
      ]}
    />
  );
}
