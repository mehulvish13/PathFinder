import { formatHours } from "../../utils/format";
import type { RoadmapPhase } from "../../types/api";

interface PhaseTimelineProps {
  phases: RoadmapPhase[];
}

/**
 * Sequence strip for the roadmap phases. The backend exposes no per-phase
 * completion state, so the timeline only distinguishes the current phase
 * (Phase 1 — the source of the backend next action) from upcoming phases.
 * Nothing here is a completion claim.
 */
export function PhaseTimeline({ phases }: PhaseTimelineProps) {
  if (phases.length === 0) return null;

  return (
    <section className="card" aria-label="Phase timeline">
      <div className="timeline">
        {phases.map((phase, index) => (
          <div
            key={phase.id}
            className={
              "timeline-step" + (index === 0 ? " timeline-step--current" : "")
            }
          >
            <span
              className={
                "timeline-dot" + (index === 0 ? " timeline-dot--current" : "")
              }
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className="timeline-label">
              <span className="timeline-phase">{phase.title}</span>
              <span className="subtle">
                {index === 0 ? "Current" : "Upcoming"} ·{" "}
                {formatHours(phase.estimated_hours)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
