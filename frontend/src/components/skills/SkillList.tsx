import { EmptyState } from "../common/EmptyState";
import {
  formatPercent,
  formatPoints,
  humanizeSkillId,
  importanceBadgeClass,
} from "../../utils/format";
import type { SkillRow } from "./skillRows";

export type SkillFilter = "all" | "gaps" | "mastered";

interface SkillListProps {
  rows: SkillRow[];
  selectedId: string | null;
  filter: SkillFilter;
  onFilterChange: (filter: SkillFilter) => void;
  onSelect: (skillId: string) => void;
  career: string | null;
}

function stateBadge(row: SkillRow): { className: string; label: string } {
  if (row.state === "mastered") return { className: "badge badge--success", label: "mastered" };
  if (row.stepStatus === "blocked") return { className: "badge badge--danger", label: "blocked" };
  if (row.recordStatus) return { className: "badge badge--warning", label: row.recordStatus };
  return { className: "badge badge--warning", label: "open gap" };
}

/**
 * Selectable skill list with a backend-state filter. Ordering follows the
 * backend recommendation ranking; React never re-ranks skills.
 */
export function SkillList({
  rows,
  selectedId,
  filter,
  onFilterChange,
  onSelect,
  career,
}: SkillListProps) {
  const visible =
    filter === "all"
      ? rows
      : rows.filter((row) => (filter === "mastered" ? row.state === "mastered" : row.state === "gap"));

  const gapCount = rows.filter((row) => row.state === "gap").length;
  const masteredCount = rows.filter((row) => row.state === "mastered").length;

  return (
    <section className="card" aria-labelledby="skill-list-title">
      <div className="section-header">
        <div>
          <div className="card__title" id="skill-list-title">
            Skills
          </div>
          <div className="card__subtitle">
            {career
              ? `Measured against your ${career} requirements.`
              : "Measured against your target career requirements."}
          </div>
        </div>
      </div>

      <div className="row" role="group" aria-label="Filter skills">
        {(
          [
            { value: "all", label: `All (${rows.length})` },
            { value: "gaps", label: `Open gaps (${gapCount})` },
            { value: "mastered", label: `Mastered (${masteredCount})` },
          ] as Array<{ value: SkillFilter; label: string }>
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              "button button--secondary button--small" +
              (filter === option.value ? " button--active" : "")
            }
            aria-pressed={filter === option.value}
            onClick={() => onFilterChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ marginTop: 12 }}>
          <EmptyState
            icon="◆"
            title={filter === "mastered" ? "No mastered skills yet" : "No skills in this view"}
            message={
              filter === "mastered"
                ? "Skills appear here when your mastery meets the career requirement."
                : "Try a different filter."
            }
          />
        </div>
      ) : (
        <ul className="skill-list">
          {visible.map((row) => {
            const badge = stateBadge(row);
            return (
              <li key={row.skill_id}>
                <button
                  type="button"
                  className={
                    "skill-row" + (selectedId === row.skill_id ? " skill-row--selected" : "")
                  }
                  aria-pressed={selectedId === row.skill_id}
                  onClick={() => onSelect(row.skill_id)}
                >
                  <span className="skill-row__main">
                    <span className="skill-row__name">
                      {humanizeSkillId(row.skill_id)}
                    </span>
                    <span className="skill-row__meta">
                      {row.current != null && row.required != null ? (
                        <>
                          {formatPercent(row.current)} →{" "}
                          {formatPercent(row.required)}
                          {row.gap != null ? ` · Gap ${formatPoints(row.gap)}` : null}
                        </>
                      ) : (
                        "No mastery recorded"
                      )}
                    </span>
                  </span>
                  <span className="skill-row__badges">
                    {row.importance && row.state === "gap" ? (
                      <span className={importanceBadgeClass(row.importance)}>
                        {row.importance}
                      </span>
                    ) : null}
                    <span className={badge.className}>{badge.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
