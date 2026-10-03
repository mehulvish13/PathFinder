import { useCallback, useMemo, useState } from "react";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { AssessmentLanding } from "../components/assessment/AssessmentLanding";
import { AssessmentResultView } from "../components/assessment/AssessmentResult";
import { AssessmentSession } from "../components/assessment/AssessmentSession";
import { useLearner } from "../app/LearnerContext";
import { useAsync } from "../hooks/useAsync";
import { api, ApiError } from "../services/api";
import type {
  AdaptationResult,
  AssessmentResult,
  AssessmentStartResponse,
} from "../types/api";

type Stage =
  | { name: "landing" }
  | { name: "session"; start: AssessmentStartResponse }
  | { name: "result"; result: AssessmentResult; start: AssessmentStartResponse };

function apiMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Interactive assessment flow: choose a skill → answer → submit → scored
 * result with mastery before/after and backend adaptation included.
 *
 * Scoring, mastery blending, gap deltas and roadmap recalculation all happen
 * in the backend. React holds only the in-progress answers (which never
 * leave the page except inside the submit call) and displays the response.
 */
export default function Assessment() {
  const { learnerId, targetCareer, hoursPerWeek } = useLearner();
  const [stage, setStage] = useState<Stage>({ name: "landing" });
  const [skillId, setSkillId] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

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

  const options = useMemo(
    () =>
      Array.isArray(path.data?.recommendations) ? path.data.recommendations : [],
    [path.data],
  );
  const career = path.data?.target_career ?? null;
  const activeSkillId = skillId || options[0]?.skill_id || "";

  const resetToLanding = useCallback(() => {
    setStage({ name: "landing" });
    setAnswers(new Map());
    setQuestionIndex(0);
    setStartError(null);
    setSubmitError(null);
    setConfirming(false);
    path.reload();
  }, [path.reload]);

  const handleStart = useCallback(async () => {
    if (!activeSkillId || starting) return;
    const selected = options.find((rec) => rec.skill_id === activeSkillId) ?? null;
    setStarting(true);
    setStartError(null);
    try {
      const start = await api.startAssessment({
        learner_id: learnerId,
        skill_id: activeSkillId,
        num_questions: numQuestions,
        // Career-specific target when the skill is an open gap; the backend
        // default applies otherwise.
        required_mastery: selected?.required_mastery ?? 70,
      });
      setSkillId(start.skill_id);
      setAnswers(new Map());
      setQuestionIndex(0);
      setSubmitError(null);
      setConfirming(false);
      setStage({ name: "session", start });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setStartError(
          `${apiMessage(err)} This skill may not have a question bank yet — try another skill.`,
        );
      } else {
        setStartError(apiMessage(err));
      }
    } finally {
      setStarting(false);
    }
  }, [activeSkillId, starting, options, learnerId, numQuestions]);

  const handleSelect = useCallback((questionId: string, optionIndex: number) => {
    setAnswers((prev) => new Map(prev).set(questionId, optionIndex));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (stage.name !== "session" || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await api.submitAssessment({
        assessment_id: stage.start.assessment_id,
        answers: [...answers.entries()].map(([question_id, selected_index]) => ({
          question_id,
          selected_index,
        })),
        // Present → the backend returns the regenerated roadmap in the same
        // response; absent → scoring only. Always present here: the result
        // screen shows the adaptive outcome.
        target_career: targetCareer,
        hours_per_week: hoursPerWeek,
      });
      setConfirming(false);
      setStage({ name: "result", result, start: stage.start });
    } catch (err) {
      setSubmitError(apiMessage(err));
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }, [stage, submitting, answers, targetCareer, hoursPerWeek]);

  let body: JSX.Element | null = null;

  if (path.loading) {
    body = <LoadingState message="Loading assessable skills…" />;
  } else if (path.error) {
    const err = path.error;
    const title =
      err instanceof ApiError && err.status === 404
        ? "No learning path for this career"
        : err instanceof ApiError && (err.kind === "network" || err.kind === "timeout")
          ? "Backend unreachable"
          : "Could not load assessable skills";
    body = <ErrorState title={title} message={apiMessage(err)} onRetry={path.reload} />;
  } else if (stage.name === "result") {
    body = (
      <div className="stack-16">
        <AssessmentResultView
          result={stage.result}
          questions={stage.start.questions}
          career={career}
          onRetake={() => {
            setAnswers(new Map());
            setQuestionIndex(0);
            setSubmitError(null);
            setConfirming(false);
            setStage({ name: "landing" });
          }}
          onNewSkill={resetToLanding}
        />
      </div>
    );
  } else if (stage.name === "session") {
    body = (
      <AssessmentSession
        skillId={stage.start.skill_id}
        questions={stage.start.questions}
        index={questionIndex}
        answers={answers}
        submitting={submitting}
        submitError={submitError}
        confirming={confirming}
        onSelect={handleSelect}
        onNavigate={setQuestionIndex}
        onRequestSubmit={() => setConfirming(true)}
        onCancelConfirm={() => setConfirming(false)}
        onConfirmSubmit={handleSubmit}
        onAbandon={resetToLanding}
      />
    );
  } else if (options.length === 0) {
    body = (
      <>
        <AssessmentLanding
          options={options}
          skillId={activeSkillId}
          numQuestions={numQuestions}
          starting={starting}
          startError={startError}
          career={career}
          onSkillChange={setSkillId}
          onNumQuestionsChange={setNumQuestions}
          onStart={handleStart}
        />
        <div style={{ marginTop: 16 }}>
          <EmptyState
            icon="✓"
            title="Nothing to assess"
            message="The backend reports no open skill gaps for this learner and career."
          />
        </div>
      </>
    );
  } else {
    body = (
      <AssessmentLanding
        options={options}
        skillId={activeSkillId}
        numQuestions={numQuestions}
        starting={starting}
        startError={startError}
        career={career}
        onSkillChange={setSkillId}
        onNumQuestionsChange={setNumQuestions}
        onStart={handleStart}
      />
    );
  }

  return body;
}
