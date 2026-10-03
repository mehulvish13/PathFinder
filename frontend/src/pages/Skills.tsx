import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { MasteryHistory } from "../components/skills/MasteryHistory";
import { SkillDetail } from "../components/skills/SkillDetail";
import { SkillList, type SkillFilter } from "../components/skills/SkillList";
import { SkillsHeader } from "../components/skills/SkillsHeader";
import { SkillsOverview } from "../components/skills/SkillsOverview";
import { SkillsSkeleton } from "../components/skills/SkillsSkeleton";
import { buildSkillsIndex } from "../components/skills/skillRows";
import { useLearner } from "../app/LearnerContext";
import { useAsync } from "../hooks/useAsync";
import { api, ApiError } from "../services/api";
import { humanizeCareerId } from "../utils/format";
import type {
  AdaptationResult,
  LearnerProgress,
  SkillMastery,
} from "../types/api";

function endpointErrorInfo(error: Error, what: string): { title: string; message: string } {
  if (error instanceof ApiError && (error.kind === "network" || error.kind === "timeout")) {
    return { title: "Backend unreachable", message: error.message };
  }
  if (error instanceof ApiError && error.kind === "http") {
    return {
      title: `${what} request failed${error.status ? ` (HTTP ${error.status})` : ""}`,
      message: error.message,
    };
  }
  return { title: `Could not load ${what}`, message: error.message };
}

/**
 * Skills & progress workspace.
 *
 * Data sources (existing backend endpoints, no invented APIs):
 *  - POST /api/adaptation/recalculate → career-specific gaps, importance,
 *    readiness, cleared skills and per-skill resources.
 *  - GET  /api/progress/{learner_id}/skills → recorded mastery + status.
 *  - GET  /api/progress/{learner_id} → overall progress and the mastery
 *    history (including assessment-driven changes).
 *
 * The recalculation response is required; the two progress responses degrade
 * gracefully. Gaps are never computed in React.
 */
export default function Skills() {
  const { learnerId, targetCareer, hoursPerWeek } = useLearner();
  const [searchParams] = useSearchParams();
  // Deep link (e.g. Roadmap → View Skill). Unknown ids fall back to the
  // default selection below — the backend remains the source of truth.
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams.get("skill"),
  );
  const [filter, setFilter] = useState<SkillFilter>("all");

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

  const mastery = useAsync<SkillMastery[]>(
    useCallback(
      (signal: AbortSignal) => api.getSkillMastery(learnerId, signal),
      [learnerId],
    ),
    [learnerId],
  );

  const progress = useAsync<LearnerProgress>(
    useCallback(
      (signal: AbortSignal) => api.getProgress(learnerId, signal),
      [learnerId],
    ),
    [learnerId],
  );

  const refreshAll = useCallback(() => {
    path.reload();
    mastery.reload();
    progress.reload();
  }, [path.reload, mastery.reload, progress.reload]);

  const index = useMemo(
    () =>
      buildSkillsIndex(
        Array.isArray(path.data?.recommendations) ? path.data.recommendations : [],
        Array.isArray(path.data?.cleared_skills) ? path.data.cleared_skills : [],
        Array.isArray(mastery.data) ? mastery.data : [],
        (path.data?.roadmap && Array.isArray(path.data.roadmap.phases)
          ? path.data.roadmap.phases
          : []
        ).flatMap((phase) => (Array.isArray(phase.skills) ? phase.skills : [])),
        Array.isArray(progress.data?.milestones) ? progress.data.milestones : [],
      ),
    [path.data, mastery.data, progress.data],
  );

  const career = path.data?.target_career ?? null;
  const selected =
    (selectedId ? index.byId.get(selectedId) ?? null : null) ??
    index.rows.find((row) => row.state === "gap") ??
    index.rows[0] ??
    null;

  const supplementFailed = mastery.error ?? progress.error;

  const header = (
    <SkillsHeader
      career={career}
      fallbackCareer={humanizeCareerId(targetCareer)}
      learnerId={learnerId}
      refreshing={path.loading || mastery.loading || progress.loading}
      onRefresh={refreshAll}
    />
  );

  let body: JSX.Element | null = null;

  if (path.loading) {
    body = <SkillsSkeleton />;
  } else if (path.error) {
    const info = endpointErrorInfo(path.error, "roadmap");
    body = <ErrorState {...info} onRetry={refreshAll} />;
  } else if (!path.data) {
    body = (
      <EmptyState
        icon="◆"
        title="No skills data available"
        message="The backend returned no skill data for this learner."
      />
    );
  } else if (index.rows.length === 0) {
    body = (
      <EmptyState
        icon="◆"
        title="No skills tracked yet"
        message="Set your learner and target career in the header, then refresh. Skills appear here once the backend reports mastery or gaps."
        action={
          <button type="button" className="button" onClick={refreshAll}>
            Refresh
          </button>
        }
      />
    );
  } else {
    const openGaps = index.rows.filter((row) => row.state === "gap").length;
    const mastered = index.rows.filter((row) => row.state === "mastered").length;
    const events = Array.isArray(progress.data?.milestones)
      ? progress.data.milestones
      : [];

    body = (
      <>
        <SkillsOverview
          tracked={index.rows.length}
          mastered={mastered}
          openGaps={openGaps}
          overallProgress={progress.data?.overall_progress ?? null}
          completedResources={progress.data?.completed_resources ?? null}
          totalResources={progress.data?.total_resources ?? null}
        />

        {supplementFailed ? (
          <div className="notice notice--error" role="alert">
            Some supplementary data failed to load ({supplementFailed.message}).
            Core skill data is shown;{" "}
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={refreshAll}
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="grid grid--2">
          <SkillList
            rows={index.rows}
            selectedId={selected?.skill_id ?? null}
            filter={filter}
            onFilterChange={setFilter}
            onSelect={setSelectedId}
            career={career}
          />
          <SkillDetail
            row={selected}
            history={
              selected ? (index.historyBySkill.get(selected.skill_id) ?? []) : []
            }
            career={career}
          />
        </div>

        <MasteryHistory events={events} />
      </>
    );
  }

  return (
    <>
      {header}
      {body ? <div className="stack-16" style={{ marginTop: 16 }}>{body}</div> : null}
    </>
  );
}
