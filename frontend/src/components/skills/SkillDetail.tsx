import { Link } from "react-router-dom";
import { EmptyState } from "../common/EmptyState";
import {
  clampPercent,
  formatDate,
  formatPercent,
  formatPoints,
  humanizeSkillId,
  importanceBadgeClass,
  readinessBadgeClass,
} from "../../utils/format";
import type { MilestoneRecord } from "../../types/api";
import type { SkillRow } from "./skillRows";

interface SkillDetailProps {
  row: SkillRow | null;
  history: MilestoneRecord[];
  career: string | null;
}

/** Human label for a backend mastery-event source. Presentation only. */
function sourceLabel(source: string | null | undefined): string {
  switch ((source ?? "").toLowerCase()) {
    case "quiz":
      return "Assessment";
    case "resource_completion":
      return "Resource completed";
    case "self_assessment":
      return "Self assessment";
    default:
      return source || "Recorded";
  }
}

/**
 * Detail panel for the selected skill: backend mastery figures, readiness,
 * prerequisites, curated resources and the skill's own mastery history.
 */
export function SkillDetail({ row, history, career }: SkillDetailProps) {
  if (!row) {
    return (
      <section className="card" aria-labelledby="skill-detail-title">
        <div className="card__title" id="skill-detail-title">
          Skill detail
        </div>
        <EmptyState
          icon="◆"
          title="Select a skill"
          message="Choose a skill from the list to see its mastery, prerequisites, resources and history."
        />
      </section>
    );
  }

  const readiness = row.stepStatus ?? row.recordStatus;

  return (
    <section className="card" aria-labelledby="skill-detail-title">
      <div className="section-header">
        <div>
          <div className="card__title" id="skill-detail-title">
            {humanizeSkillId(row.skill_id)}
          </div>
          <div className="card__subtitle">
            {row.state === "mastered"
              ? "Your mastery meets the career requirement."
              : career
                ? `Measured against your ${career} requirement.`
                : "Measured against your target career requirement."}
          </div>
        </div>
        <div className="row">
          {row.importance && row.state === "gap" ? (
            <span className={importanceBadgeClass(row.importance)}>
              {row.importance} importance
            </span>
          ) : null}
          {readiness ? (
            <span className={readinessBadgeClass(readiness)}>{readiness}</span>
          ) : null}
          {row.state === "mastered" ? (
            <span className="badge badge--success">mastered</span>
          ) : null}
        </div>
      </div>

      {row.current != null && row.required != null ? (
        <>
          <div
            className="gap-bar"
            role="img"
            aria-label={`${humanizeSkillId(row.skill_id)}: ${formatPercent(
              row.current,
            )} current mastery against ${formatPercent(row.required)} required`}
          >
            <div
              className="gap-bar__fill"
              style={{ width: `${clampPercent(row.current)}%` }}
            />
            <div
              className="gap-bar__target"
              style={{ left: `${clampPercent(row.required)}%` }}
            />
          </div>
          <div className="focus-grid" style={{ marginTop: 12 }}>
            <div className="metric">
              <div className="metric__label">Current mastery</div>
              <div className="metric__value">{formatPercent(row.current)}</div>
            </div>
            <div className="metric">
              <div className="metric__label">Required mastery</div>
              <div className="metric__value">{formatPercent(row.required)}</div>
            </div>
            <div className="metric">
              <div className="metric__label">Gap</div>
              <div className="metric__value">
                {row.gap != null ? formatPoints(row.gap) : "—"}
              </div>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon="○"
          title="No mastery recorded"
          message="Complete a resource or take an assessment to start tracking this skill."
        />
      )}

      {row.prerequisites.length > 0 ? (
        <div className="prereq-chain">
          <span className="metric__label">Prerequisites</span>
          <div className="row">
            {row.prerequisites.map((prereqId) => (
              <span className="chip" key={prereqId}>
                {humanizeSkillId(prereqId)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {row.resources.length > 0 ? (
        <div className="step-card__resources">
          <span className="metric__label">Learning resources</span>
          <ul className="resource-list">
            {row.resources.map((resource) => (
              <li className="resource-item" key={resource.id}>
                <div className="resource-item__main">
                  <div className="resource-item__head">
                    {resource.url ? (
                      <a
                        className="resource-item__title"
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {resource.title}
                      </a>
                    ) : (
                      <span className="resource-item__title">{resource.title}</span>
                    )}
                  </div>
                  <div className="resource-item__meta">
                    <span className="subtle">
                      {resource.type} · {resource.difficulty}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="step-card__resources">
        <span className="metric__label">Mastery history</span>
        {history.length === 0 ? (
          <p className="subtle">No mastery events recorded for this skill yet.</p>
        ) : (
          <ul className="history-list">
            {history.map((event, index) => (
              <li
                className="history-item"
                key={`${event.skill_id}-${event.recorded_at ?? index}`}
              >
                <span className="badge badge--success">
                  {formatPercent(event.mastery)}
                </span>
                <span className="subtle">{sourceLabel(event.source)}</span>
                <span className="subtle">{formatDate(event.recorded_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {row.state === "gap" ? (
        <div className="row" style={{ marginTop: 14 }}>
          <Link className="button" to="/assessment">
            Take Assessment
          </Link>
          <Link className="button button--secondary" to="/roadmap">
            View Roadmap
          </Link>
        </div>
      ) : null}
    </section>
  );
}
