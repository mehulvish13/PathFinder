import { Link } from "react-router-dom";
import { ResourceList } from "./ResourceList";
import {
  clampPercent,
  formatAction,
  formatPercent,
  formatPoints,
  humanizeSkillId,
  importanceBadgeClass,
  readinessBadgeClass,
} from "../../utils/format";
import type { Recommendation, RoadmapSkill } from "../../types/api";

interface LearningStepCardProps {
  /** Raw learning-path step from the backend (carries status + resources). */
  step: RoadmapSkill;
  /** Backend recommendation for the same skill, when the skill is an open gap. */
  recommendation: Recommendation | null;
  /**
   * Backend recommendations indexed by skill id, used only to describe
   * prerequisite skills that are themselves open gaps.
   */
  recommendationsById: Map<string, Recommendation>;
  /** Skills the backend reports as already mastered. */
  clearedSkills: Set<string>;
  career: string | null;
  pendingResourceId: string | null;
  onCompleteResource: (resourceId: string) => void;
}

/**
 * One learning step. Mastery, gap, importance and readiness are backend
 * values; the "why" line only composes backend fields into a sentence.
 */
export function LearningStepCard({
  step,
  recommendation,
  recommendationsById,
  clearedSkills,
  career,
  pendingResourceId,
  onCompleteResource,
}: LearningStepCardProps) {
  const blocked = step.status === "blocked";
  const prereqs = Array.isArray(step.prerequisites) ? step.prerequisites : [];
  const resources = Array.isArray(step.resources) ? step.resources : [];

  const current = recommendation?.current_mastery ?? step.current_mastery;
  const required = recommendation?.required_mastery ?? step.required_mastery;
  const gap = recommendation?.gap ?? step.gap;
  const importance = recommendation?.importance;

  const whyParts: string[] = [];
  if (importance) whyParts.push(`${importance} importance`);
  if (gap != null) whyParts.push(`${formatPoints(gap)} below target`);
  if (career) whyParts.push(`required for your ${career} path`);

  return (
    <article
      className={"step-card" + (blocked ? " step-card--blocked" : "")}
      aria-label={humanizeSkillId(step.skill_id)}
    >
      <div className="step-card__head">
        <span className="step-card__name">
          {humanizeSkillId(step.skill_id)}
        </span>
        <span className="row">
          {importance ? (
            <span className={importanceBadgeClass(importance)}>
              {importance}
            </span>
          ) : null}
          <span className={readinessBadgeClass(step.status)}>
            {blocked ? "blocked" : (step.status ?? "ready")}
          </span>
        </span>
      </div>

      {current != null && required != null ? (
        <>
          <div
            className="gap-bar"
            role="img"
            aria-label={`${humanizeSkillId(step.skill_id)}: ${formatPercent(
              current,
            )} current mastery against ${formatPercent(required)} required`}
          >
            <div
              className="gap-bar__fill"
              style={{ width: `${clampPercent(current)}%` }}
            />
            <div
              className="gap-bar__target"
              style={{ left: `${clampPercent(required)}%` }}
            />
          </div>
          <div className="gap-item__meta">
            <span>Current {formatPercent(current)}</span>
            <span>Target {formatPercent(required)}</span>
            {gap != null ? (
              <span className="gap-item__gap">Gap {formatPoints(gap)}</span>
            ) : null}
          </div>
        </>
      ) : null}

      {whyParts.length > 0 ? (
        <p className="subtle" style={{ marginTop: 8 }}>
          Why: {formatAction(whyParts.join(" · "))}.
        </p>
      ) : null}

      {blocked && prereqs.length > 0 ? (
        <div className="prereq-chain">
          <span className="metric__label">Blocked by prerequisites</span>
          <ul className="prereq-list">
            {prereqs.map((prereqId) => {
              const prereq = recommendationsById.get(prereqId) ?? null;
              return (
                <li className="prereq-item" key={prereqId}>
                  <span className="prereq-item__name">
                    🔒 {humanizeSkillId(prereqId)}
                  </span>
                  {prereq ? (
                    <span className="subtle">
                      Current {formatPercent(prereq.current_mastery)} ·
                      Required {formatPercent(prereq.required_mastery)}
                    </span>
                  ) : (
                    <span className="subtle">
                      {clearedSkills.has(prereqId)
                        ? "Already mastered"
                        : "Mastery not yet recorded"}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <Link className="button button--secondary button--small" to="/skills">
            Review Skills
          </Link>
        </div>
      ) : null}

      <div className="step-card__resources">
        <span className="metric__label">Resources</span>
        <ResourceList
          resources={resources}
          pendingId={pendingResourceId}
          onComplete={onCompleteResource}
        />
      </div>
    </article>
  );
}
