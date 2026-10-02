import { useCallback } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { EmptyState } from "../components/common/EmptyState";
import { useLearner } from "../app/LearnerContext";
import { useAsync } from "../hooks/useAsync";
import { api, ApiError } from "../services/api";
import type { Dashboard as DashboardData, HealthResponse } from "../types/api";
import {
  formatHours,
  formatPercent,
  humanizeCareerId,
  humanizeSkillId,
} from "../utils/format";

export default function Dashboard() {
  const { learnerId, targetCareer } = useLearner();

  const dashboard = useAsync<DashboardData>(
    useCallback(
      (signal: AbortSignal) => api.getDashboard(learnerId, signal),
      [learnerId],
    ),
    [learnerId],
  );

  const health = useAsync<HealthResponse>(
    useCallback((signal: AbortSignal) => api.getHealth(signal), []),
    [],
  );

  const data = dashboard.data;
  // Defensive: a backend payload that is valid JSON but missing these arrays
  // must not crash rendering. Backend remains the source of the values.
  const skillMastery = Array.isArray(data?.skill_mastery) ? data.skill_mastery : [];
  const milestones = Array.isArray(data?.milestones) ? data.milestones : [];

  return (
    <>
      <PageHeader
        eyebrow="Current learning state"
        title={`Welcome back · Learner #${learnerId}`}
        description={`Target career: ${humanizeCareerId(targetCareer)}. This overview is loaded from the PathFinder backend.`}
        actions={
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              dashboard.reload();
              health.reload();
            }}
          >
            Refresh
          </button>
        }
      />

      {/* Backend connectivity proof */}
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="card__title">Backend connectivity</div>
            <div className="card__subtitle">
              Live status from <code>GET /health</code> and{" "}
              <code>GET /api/progress/dashboard/{learnerId}</code>.
            </div>
          </div>
          <span
            className={
              "connection " +
              (health.loading
                ? "connection--checking"
                : health.error
                  ? "connection--error"
                  : "connection--ok")
            }
          >
            <span className="connection__dot" aria-hidden="true" />
            {health.loading
              ? "Checking…"
              : health.error
                ? "Backend unreachable"
                : "Backend connected"}
          </span>
        </div>
        {health.error ? (
          <p className="state__title" style={{ marginTop: 10, color: "var(--pf-danger)" }}>
            {health.error.message}
          </p>
        ) : null}
      </div>

      {dashboard.loading ? (
        <div style={{ marginTop: 16 }}>
          <LoadingState message="Loading your learning state…" />
        </div>
      ) : dashboard.error ? (
        <div style={{ marginTop: 16 }}>
          <ErrorState
            title={
              dashboard.error instanceof ApiError && dashboard.error.status === 404
                ? "Learner not found"
                : "Could not load your learning state"
            }
            message={dashboard.error.message}
            onRetry={dashboard.reload}
          />
        </div>
      ) : data ? (
        <>
          <div className="grid grid--4" style={{ marginTop: 16 }}>
            <StatCard
              label="Overall progress"
              value={formatPercent(data.overall_progress)}
              hint={`${data.completed_resources} of ${data.total_resources} resources`}
            />
            <StatCard
              label="In progress"
              value={data.in_progress_resources}
              hint="Resources currently started"
            />
            <StatCard
              label="Not started"
              value={data.not_started_resources}
              hint="Queued resources"
            />
            <StatCard
              label="Time remaining"
              value={formatHours(data.estimated_time_remaining)}
              hint="Estimated from resource hours"
            />
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card__title">Next action</div>
            <p className="card__subtitle">
              Determined by the backend from your current progress.
            </p>
            <p style={{ marginTop: 10, fontWeight: 600 }}>{data.next_action}</p>
            {data.progress_bar ? (
              <p className="subtle" style={{ marginTop: 6, fontFamily: "monospace" }}>
                {data.progress_bar}
              </p>
            ) : null}
          </div>

          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="card__title">Skill mastery</div>
                <div className="card__subtitle">
                  Latest mastery recorded by the backend.
                </div>
              </div>
              <span className="badge badge--neutral">
                {skillMastery.length} tracked
              </span>
            </div>

            {skillMastery.length === 0 ? (
              <EmptyState
                icon="◆"
                title="No mastery recorded yet"
                message="Complete a resource or pass an assessment to start tracking skills."
              />
            ) : (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Current</th>
                    <th>Target</th>
                    <th>Gap</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {skillMastery.map((s) => (
                    <tr key={s.skill_id}>
                      <td>{s.skill_name || humanizeSkillId(s.skill_id)}</td>
                      <td>{formatPercent(s.current_mastery)}</td>
                      <td>{formatPercent(s.target_mastery)}</td>
                      <td>{formatPercent(s.gap)}</td>
                      <td>
                        <span
                          className={
                            "badge " +
                            (s.status === "ready" ? "badge--success" : "badge--warning")
                          }
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="card__title">Recent milestones</div>
            <div className="card__subtitle">
              Mastery events recorded by the backend.
            </div>

            {milestones.length === 0 ? (
              <EmptyState
                icon="◈"
                title="No milestones yet"
                message="Milestones appear as you make progress through your roadmap."
              />
            ) : (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Mastery</th>
                    <th>Source</th>
                    <th>Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.slice(0, 8).map((m, idx) => (
                    <tr key={`${m.skill_id}-${m.recorded_at ?? idx}`}>
                      <td>{humanizeSkillId(m.skill_id)}</td>
                      <td>{formatPercent(m.mastery)}</td>
                      <td>{m.source}</td>
                      <td className="muted">{m.recorded_at ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            icon="▦"
            title="No learning state available"
            message="The backend returned no dashboard data for this learner."
          />
        </div>
      )}
    </>
  );
}
