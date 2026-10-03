import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { RoadmapHeader } from "../components/roadmap/RoadmapHeader";
import { RoadmapOverview } from "../components/roadmap/RoadmapOverview";
import { RoadmapPhaseSection } from "../components/roadmap/RoadmapPhase";
import { RoadmapSkeleton } from "../components/roadmap/RoadmapSkeleton";
import { PhaseTimeline } from "../components/roadmap/PhaseTimeline";
import { useLearner } from "../app/LearnerContext";
import { useAsync } from "../hooks/useAsync";
import { api, ApiError } from "../services/api";
import { formatAction, humanizeCareerId } from "../utils/format";
import type {
  AdaptationResult,
  Dashboard as DashboardData,
  Recommendation,
} from "../types/api";

/** Sentinel strings the backend returns when there is nothing to do. */
const NO_PATH_ACTIONS = new Set([
  "No learning path available yet.",
  "No next action available.",
]);

function roadmapErrorInfo(error: Error): { title: string; message: string } {
  if (error instanceof ApiError && error.status === 404) {
    return {
      title: "No learning path for this career",
      message: `${error.message} Pick another target career in the header, then retry.`,
    };
  }
  if (error instanceof ApiError && (error.kind === "network" || error.kind === "timeout")) {
    return { title: "Backend unreachable", message: error.message };
  }
  if (error instanceof ApiError && error.kind === "http") {
    return {
      title: `The API returned an error${error.status ? ` (HTTP ${error.status})` : ""}`,
      message: error.message,
    };
  }
  return { title: "Could not load your roadmap", message: error.message };
}

/**
 * Full learning roadmap page.
 *
 * Data sources (existing backend endpoints, no invented APIs):
 *  - POST /api/adaptation/recalculate → skill gaps, recommendations with
 *    mastery/gap/importance, learning-path steps with ready/blocked status,
 *    prerequisites and resources, plus the phased roadmap and next action.
 *  - GET  /api/progress/dashboard/{learner_id} → overall progress for the
 *    overview (optional: the roadmap renders without it).
 *
 * Completing a resource calls POST /api/progress/complete and then refreshes
 * both responses, so the roadmap always reflects backend state. No mastery,
 * gap or ordering value is computed in React.
 */
export default function Roadmap() {
  const { learnerId, targetCareer, hoursPerWeek } = useLearner();
  const [pendingResourceId, setPendingResourceId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const path = useAsync<AdaptationResult>(
    useCallback(
      (signal: AbortSignal) =>
        api.recalculate(
          {
            learner_id: learnerId,
            target_career: targetCareer,
            hours_per_week: hoursPerWeek,
          },
          signal,
        ),
      [learnerId, targetCareer, hoursPerWeek],
    ),
    [learnerId, targetCareer, hoursPerWeek],
  );

  const progress = useAsync<DashboardData>(
    useCallback(
      (signal: AbortSignal) => api.getDashboard(learnerId, signal),
      [learnerId],
    ),
    [learnerId],
  );

  const refreshAll = useCallback(() => {
    setNotice(null);
    path.reload();
    progress.reload();
  }, [path.reload, progress.reload]);

  const handleCompleteResource = useCallback(
    async (resourceId: string) => {
      setPendingResourceId(resourceId);
      setNotice(null);
      try {
        const result = await api.completeResource({
          learner_id: learnerId,
          resource_id: resourceId,
        });
        setNotice({ kind: "ok", text: result.message });
        path.reload();
        progress.reload();
      } catch (err) {
        setNotice({
          kind: "error",
          text: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setPendingResourceId(null);
      }
    },
    [learnerId, path.reload, progress.reload],
  );

  const recommendationsById = useMemo(() => {
    const map = new Map<string, Recommendation>();
    const list = Array.isArray(path.data?.recommendations)
      ? path.data.recommendations
      : [];
    for (const rec of list) map.set(rec.skill_id, rec);
    return map;
  }, [path.data]);

  const clearedSkills = useMemo(
    () => new Set(path.data?.cleared_skills ?? []),
    [path.data],
  );

  const pathData = path.data;
  const phases =
    pathData?.roadmap && Array.isArray(pathData.roadmap.phases)
      ? pathData.roadmap.phases
      : [];
  const career = pathData?.target_career ?? null;
  const roadmapAction =
    pathData?.roadmap?.next_action &&
    !NO_PATH_ACTIONS.has(pathData.roadmap.next_action)
      ? pathData.roadmap.next_action
      : null;

  const header = (
    <RoadmapHeader
      career={career}
      fallbackCareer={humanizeCareerId(targetCareer)}
      hoursPerWeek={hoursPerWeek}
      totalHours={pathData?.roadmap?.total_estimated_hours ?? null}
      estimatedWeeks={pathData?.roadmap?.estimated_weeks ?? null}
      refreshing={path.loading || progress.loading}
      onRefresh={refreshAll}
    />
  );

  let body: JSX.Element | null = null;

  if (path.loading) {
    body = <RoadmapSkeleton />;
  } else if (path.error) {
    const info = roadmapErrorInfo(path.error);
    body = <ErrorState {...info} onRetry={path.reload} />;
  } else if (!pathData) {
    body = (
      <EmptyState
        icon="◈"
        title="No roadmap data available"
        message="The backend returned no roadmap for this learner."
      />
    );
  } else if (phases.length === 0) {
    body = (
      <EmptyState
        icon="◈"
        title="No personalized roadmap yet"
        message="Set your learner and target career in the header, then refresh to generate a roadmap from your current mastery."
        action={
          <button type="button" className="button" onClick={refreshAll}>
            Refresh
          </button>
        }
      />
    );
  } else {
    body = (
      <>
        <RoadmapOverview path={pathData} progress={progress.data} />
        <PhaseTimeline phases={phases} />

        {phases.map((phase, index) => (
          <RoadmapPhaseSection
            key={phase.id}
            phase={phase}
            isCurrent={index === 0}
            recommendationsById={recommendationsById}
            clearedSkills={clearedSkills}
            career={career}
            pendingResourceId={pendingResourceId}
            onCompleteResource={handleCompleteResource}
          />
        ))}

        <section className="card card--featured" aria-labelledby="roadmap-next-action">
          <div className="section-header">
            <div>
              <div className="page-header__eyebrow" id="roadmap-next-action">
                Next action
              </div>
              <div className="next-action__title">
                {roadmapAction ? formatAction(roadmapAction) : "You're currently caught up."}
              </div>
              {!roadmapAction ? (
                <p className="card__subtitle">
                  The backend has no pending action for this learner right now.
                </p>
              ) : null}
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="button button--secondary" to="/skills">
              View Skills
            </Link>
            <Link className="button button--secondary" to="/assessment">
              Take Assessment
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {header}
      {notice ? (
        <div
          className={notice.kind === "ok" ? "notice notice--ok" : "notice notice--error"}
          role={notice.kind === "ok" ? "status" : "alert"}
          style={{ marginTop: 16 }}
        >
          {notice.text}
        </div>
      ) : null}
      {body ? <div className="stack-16" style={{ marginTop: 16 }}>{body}</div> : null}
    </>
  );
}
