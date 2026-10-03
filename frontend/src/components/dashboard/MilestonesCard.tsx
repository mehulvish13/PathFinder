import { EmptyState } from "../common/EmptyState";
import { formatDate, formatPercent, humanizeSkillId } from "../../utils/format";
import type { MilestoneRecord } from "../../types/api";

/** Recent mastery events recorded by the backend (MasteryHistory). */
export function MilestonesCard({ milestones }: { milestones: MilestoneRecord[] }) {
  return (
    <section className="card" aria-labelledby="milestones-title">
      <div className="section-header">
        <div>
          <div className="card__title" id="milestones-title">
            Recent milestones
          </div>
          <div className="card__subtitle">
            Mastery events recorded by the backend.
          </div>
        </div>
        <span className="badge badge--neutral">{milestones.length}</span>
      </div>

      {milestones.length === 0 ? (
        <EmptyState
          icon="◈"
          title="No milestones yet"
          message="Milestones appear as you complete resources or pass assessments."
        />
      ) : (
        <ul className="milestone-list">
          {milestones.slice(0, 5).map((m, index) => (
            <li className="milestone-item" key={`${m.skill_id}-${index}`}>
              <div>
                <div className="milestone-item__skill">
                  {humanizeSkillId(m.skill_id)}
                </div>
                <div className="subtle">{m.source}</div>
              </div>
              <div className="milestone-item__right">
                <span className="badge badge--success">
                  {formatPercent(m.mastery)}
                </span>
                <span className="subtle">{formatDate(m.recorded_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
