import { useCallback } from "react";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { CurrentFocusCard } from "../components/dashboard/CurrentFocusCard";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import {
  DashboardPathSkeleton,
  DashboardSkeleton,
} from "../components/dashboard/DashboardSkeleton";
import { MilestonesCard } from "../components/dashboard/MilestonesCard";
import { NextActionCard } from "../components/dashboard/NextActionCard";
import { QuickActions } from "../components/dashboard/QuickActions";
import { RoadmapPreview } from "../components/dashboard/RoadmapPreview";
import { SkillGapsSection } from "../components/dashboard/SkillGapsSection";
import { SummaryCards } from "../components/dashboard/SummaryCards";
import { useLearner } from "../app/LearnerContext";
import { useAsync } from "../hooks/useAsync";
import { api, ApiError } from "../services/api";
import { humanizeCareerId } from "../utils/format";
import type {
  AdaptationResult,
  Dashboard as DashboardData,
} from "../types/api";

/** Sentinel strings the backend returns when there is nothing to do. */
const NO_PROGRESS_ACTION = "No action available";
const NO_PATH_ACTIONS = new Set([
  "No learning path available yet.",
  "No next action available.",
]);

function progressErrorInfo(error: Error): { title: string; message: string } {
  if (error instanceof ApiError) {
    if (error.kind === "network" || error.kind === "timeout") {
      return {
        title: "Backend unreachable",
        message: error.message,
      };
    }
    if (error.kind === "http") {
      return {
        title: `The API returned an error${error.status ? ` (HTTP ${error.status})` : ""}`,
        message: error.message,
      };
    }
  }
  return { title: "Could not load your learning state", message: error.message };
}

function pathErrorInfo(error: Error): { title: string; message: string } {
  if (error instanceof ApiError && error.status === 404) {
    return {
      title: "No learning path for this career",
      message: `${error.message} Pick another target career in the header, then retry.`,
    };
  }
  if (
    error instanceof ApiError &&
    (error.kind === "network" || error.kind === "timeout")
  ) {
    return { title: "Backend unreachable", message: error.message };
  }
  return { title: "Could not load your learning path", message: error.message };
}

/**
 * PathFinder dashboard.
 *
 * Data sources (both are existing backend endpoints, no invented APIs):
 *  - GET  /api/progress/dashboard/{learner_id} → progress, skill mastery,
 *    mastery milestones and the progress-derived next action.
 *  - POST /api/adaptation/recalculate → skill gaps, recommendations and the
 *    roadmap (current state + roadmap next action).
 *
 * The dashboard recalculates the path on every load, so any mastery change made
 * in the backend (e.g. after an assessment in Phase 8E) is reflected here.
 * No mastery, gap or priority value is computed in React.
 */
export default function Dashboard() {
  const { learnerId, targetCareer, hoursPerWeek } = useLearner();

  const progress = useAsync<DashboardData>(
    useCallback(
      (signal: AbortSignal) => api.getDashboard(learnerId, signal),
      [learnerId],
    ),
    [learnerId],
  );

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

  const refreshAll = useCallback(() => {
    progress.reload();
    path.reload();
  }, [progress.reload, path.reload]);

  const data = progress.data;
  const pathData = path.data;

  // Defensive: a JSON payload that is missing these arrays must not crash the
  // dashboard. The backend stays the source of every value below.
  const milestones = Array.isArray(data?.milestones) ? data.milestones : [];
  const skillGaps = Array.isArray(pathData?.skill_gaps) ? pathData.skill_gaps : [];
  const recommendations = Array.isArray(pathData?.recommendations)
    ? pathData.recommendations
    : [];
  const roadmap =
    pathData?.roadmap && Array.isArray(pathData.roadmap.phases)
      ? pathData.roadmap
      : null;

  // Canonical career name comes from the backend when it answered; otherwise we
  // fall back to the career the learner selected in the header.
  const career = pathData?.target_career ?? humanizeCareerId(targetCareer);

  const progressAction =
    data?.next_action && data.next_action !== NO_PROGRESS_ACTION
      ? data.next_action
      : null;
  const roadmapAction =
    roadmap?.next_action && !NO_PATH_ACTIONS.has(roadmap.next_action)
      ? roadmap.next_action
      : null;

  const header = (
    <DashboardHeader
      career={career}
      learnerId={learnerId}
      hoursPerWeek={hoursPerWeek}
      refreshing={progress.loading || path.loading}
      onRefresh={refreshAll}
    />
  );

  const milestonesCard = <MilestonesCard milestones={milestones} />;

  let body: JSX.Element | null = null;

  if (progress.loading) {
    body = <DashboardSkeleton />;
  } else if (progress.error) {
    const info = progressErrorInfo(progress.error);
    body = <ErrorState {...info} onRetry={progress.reload} />;
  } else if (!data) {
    body = (
      <EmptyState
        icon="▦"
        title="No learning state available"
        message="The backend returned no dashboard data for this learner."
      />
    );
  } else {
    const noActivity =
      data.total_resources === 0 &&
      data.skill_mastery.length === 0 &&
      data.milestones.length === 0;

    if (path.loading) {
      body = <DashboardPathSkeleton />;
    } else if (path.error) {
      const info = pathErrorInfo(path.error);
      // Progress data is still valid, so its milestones stay visible below the
      // error and can be recovered with Retry.
      body = (
        <>
          <ErrorState {...info} onRetry={path.reload} />
          <div style={{ marginTop: 16 }}>{milestonesCard}</div>
        </>
      );
    } else if (!pathData) {
      body = null;
    } else if (noActivity && skillGaps.length === 0 && !roadmap?.phases.length) {
      body = (
        <EmptyState
          icon="◈"
          title="No learning path yet"
          message="Set your learner and target career in the header, then refresh to generate a personalized path."
          action={
            <button type="button" className="button" onClick={refreshAll}>
              Refresh
            </button>
          }
        />
      );
    } else {
      const focus = recommendations[0] ?? null;
      body = (
        <>
          <SummaryCards data={data} />

          <CurrentFocusCard
            focus={focus}
            activity={progressAction}
            career={pathData.target_career ?? null}
          />

          <SkillGapsSection gaps={skillGaps} career={pathData.target_career ?? null} />

          <div className="grid grid--2">
            <RoadmapPreview roadmap={roadmap} hoursPerWeek={hoursPerWeek} />
            {milestonesCard}
          </div>

          <NextActionCard
            progressAction={progressAction}
            roadmapAction={roadmapAction}
            focus={focus}
            progress={data}
            career={pathData.target_career ?? null}
          />
        </>
      );
    }
  }

  return (
    <>
      {header}
      {body ? <div className="stack-16">{body}</div> : null}
      <div style={{ marginTop: 16 }}>
        <QuickActions />
      </div>
    </>
  );
}