import { ModulePlaceholder } from "../components/common/ModulePlaceholder";

export default function Assessment() {
  return (
    <ModulePlaceholder
      eyebrow="Validate mastery"
      title="Assessment"
      description="The backend assessment engine serves questions, scores answers and updates mastery. This page will drive that flow."
      phase="Phase 8E"
      capabilities={[
        "Start a quiz for a skill via POST /api/assessment/start",
        "Submit answers and display the scored result",
        "Show mastery before/after and gap change",
        "Trigger roadmap adaptation on submit",
      ]}
    />
  );
}
