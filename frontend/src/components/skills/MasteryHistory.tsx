import { EmptyState } from "../common/EmptyState";
import { formatDate, formatPercent, humanizeSkillId } from "../../utils/format";
import type { MilestoneRecord } from "../../types/api";

interface MasteryHistoryProps {
  events: MilestoneRecord[];
  limit?: number;
}

/**
 * Global mastery timeline: every backend-recorded mastery event, newest
 * first. Assessment-driven changes surface here via their backend source.
 */
export function MasteryHistory({ events, limit = 10 }: MasteryHistoryProps) {
  const ordered = [...events].sort((a, b) =>
    String(b.recorded_at ?? "").localeCompare(String(a.recorded_at ?? "")),
  );
  const visible = ordered.slice(0, limit);

  return (
    <section className="card" aria-labelledby="history-title">
      <div className="section-header">
        <div>
          <div className="card__title" id="history-title">
            Mastery history
          </div>
          <div className="card__subtitle">
            Every mastery change recorded by the backend.
          </div>
        </div>
        <span className="badge badge--neutral">{events.length}</span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="◈"
          title="No history yet"
          message="Mastery events appear as you complete resources or pass assessments."
        />
      ) : (
        <>
          <ul className="history-list">
            {visible.map((event, index) => (
              <li
                className="history-item"
                key={`${event.skill_id}-${event.recorded_at ?? index}`}
              >
                <span className="history-item__skill">
                  {humanizeSkillId(event.skill_id)}
                </span>
                <span className="history-item__right">
                  <span className="badge badge--success">
                    {formatPercent(event.mastery)}
                  </span>
                  <span className="subtle">{formatDate(event.recorded_at)}</span>
                </span>
              </li>
            ))}
          </ul>
          {ordered.length > visible.length ? (
            <p className="subtle" style={{ marginTop: 10 }}>
              Showing {visible.length} of {ordered.length} events
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
