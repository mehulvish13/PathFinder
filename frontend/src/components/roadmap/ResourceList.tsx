import { formatHours, humanizeSkillId } from "../../utils/format";
import type { PathResource } from "../../types/api";

interface ResourceListProps {
  resources: PathResource[];
  /** Resource currently being completed, if any (only one at a time). */
  pendingId: string | null;
  onComplete: (resourceId: string) => void;
}

function typeBadgeClass(type: string | null | undefined): string {
  switch ((type ?? "").toLowerCase()) {
    case "course":
      return "badge badge--info";
    case "project":
      return "badge badge--warning";
    case "assessment":
      return "badge badge--danger";
    default:
      return "badge badge--neutral";
  }
}

/**
 * Curated backend resources for one learning step. Completion calls the real
 * POST /api/progress/complete endpoint via the page handler — the list never
 * assumes a completion state, because no endpoint exposes per-resource state.
 */
export function ResourceList({ resources, pendingId, onComplete }: ResourceListProps) {
  if (resources.length === 0) {
    return (
      <p className="subtle">No curated resources for this skill yet.</p>
    );
  }

  return (
    <ul className="resource-list">
      {resources.map((resource) => (
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
              <span className={typeBadgeClass(resource.type)}>
                {resource.type}
              </span>
            </div>
            {resource.description ? (
              <p className="card__subtitle">{resource.description}</p>
            ) : null}
            <div className="resource-item__meta">
              <span className="subtle">
                {humanizeSkillId(resource.skill_id)} · {resource.difficulty} ·{" "}
                {formatHours(resource.estimated_hours)}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="button button--secondary button--small"
            disabled={pendingId !== null}
            onClick={() => onComplete(resource.id)}
          >
            {pendingId === resource.id ? "Saving…" : "Mark Complete"}
          </button>
        </li>
      ))}
    </ul>
  );
}
