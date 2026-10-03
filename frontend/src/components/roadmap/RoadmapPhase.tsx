import { LearningStepCard } from "./LearningStepCard";
import { formatHours, humanizeSkillId } from "../../utils/format";
import type { Recommendation, RoadmapPhase } from "../../types/api";

interface RoadmapPhaseProps {
  phase: RoadmapPhase;
  /** Positional emphasis only: the backend names no phase "current". */
  isCurrent: boolean;
  recommendationsById: Map<string, Recommendation>;
  clearedSkills: Set<string>;
  career: string | null;
  pendingResourceId: string | null;
  onCompleteResource: (resourceId: string) => void;
}

/**
 * One roadmap phase: milestone, skills and per-skill resources. The milestone
 * completion state is not invented — the backend supplies no per-milestone
 * status, so phases show position (current/upcoming) instead of completion.
 */
export function RoadmapPhaseSection({
  phase,
  isCurrent,
  recommendationsById,
  clearedSkills,
  career,
  pendingResourceId,
  onCompleteResource,
}: RoadmapPhaseProps) {
  const skills = Array.isArray(phase.skills) ? phase.skills : [];
  const milestoneSkills = Array.isArray(phase.milestone?.skills)
    ? phase.milestone.skills
    : [];

  return (
    <section
      className={"phase-section" + (isCurrent ? " phase-section--current" : "")}
      aria-labelledby={`${phase.id}-title`}
    >
      <div className="phase-section__rail" aria-hidden="true">
        <span
          className={
            "phase-node" + (isCurrent ? " phase-node--current" : "")
          }
        />
      </div>

      <div className="phase-section__body">
        <div className="section-header">
          <div>
            <div className="card__title" id={`${phase.id}-title`}>
              {phase.title}
            </div>
            <div className="card__subtitle">{phase.description}</div>
          </div>
          <div className="row">
            <span
              className={
                isCurrent ? "badge badge--success" : "badge badge--neutral"
              }
            >
              {isCurrent ? "Current" : "Upcoming"}
            </span>
            <span className="subtle">{formatHours(phase.estimated_hours)}</span>
          </div>
        </div>

        {phase.milestone ? (
          <div className="milestone-banner">
            <div>
              <span className="metric__label">Milestone</span>
              <div className="milestone-banner__title">
                {phase.milestone.title}
              </div>
              <p className="card__subtitle">{phase.milestone.description}</p>
            </div>
            {milestoneSkills.length > 0 ? (
              <div className="row" style={{ marginTop: 8 }}>
                {milestoneSkills.map((skillId) => (
                  <span className="chip" key={skillId}>
                    {humanizeSkillId(skillId)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="stack-16" style={{ marginTop: 14 }}>
          {skills.map((step) => (
            <LearningStepCard
              key={step.skill_id}
              step={step}
              recommendation={recommendationsById.get(step.skill_id) ?? null}
              recommendationsById={recommendationsById}
              clearedSkills={clearedSkills}
              career={career}
              pendingResourceId={pendingResourceId}
              onCompleteResource={onCompleteResource}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
