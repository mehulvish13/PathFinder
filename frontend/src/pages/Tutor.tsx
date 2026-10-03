import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { PageHeader } from "../components/common/PageHeader";
import { ChatThread, type ChatMessage } from "../components/tutor/ChatThread";
import { Composer } from "../components/tutor/Composer";
import { useLearner } from "../app/LearnerContext";
import { useAsync } from "../hooks/useAsync";
import { api, ApiError } from "../services/api";
import { humanizeSkillId } from "../utils/format";
import type { AdaptationResult, AIResponse } from "../types/api";

const SUGGESTIONS = [
  "Why am I learning this skill?",
  "What should I learn next?",
  "Can I skip this topic?",
  "Explain this concept simply.",
  "Why did my roadmap change?",
  "What project should I build?",
];

function apiMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 503) {
    return `${error.message} The tutor needs a configured LLM key with remaining quota.`;
  }
  return error instanceof Error ? error.message : String(error);
}

function groundedSummary(response: AIResponse): ChatMessage["grounded"] {
  const context = (response.context ?? {}) as Record<string, unknown>;
  const career = context["career"] as { name?: string } | undefined;
  const gaps = context["active_skill_gaps"];
  const selected = context["selected_skill"] as
    | { current_mastery?: number; gap?: number }
    | undefined;
  return {
    career: career?.name ?? response.target_career,
    openGaps: Array.isArray(gaps) ? gaps.length : 0,
    selectedMastery:
      typeof selected?.current_mastery === "number" ? selected.current_mastery : null,
    selectedGap: typeof selected?.gap === "number" ? selected.gap : null,
  };
}

/**
 * AI tutor conversation. Every answer comes from POST /api/ai/tutor or
 * POST /api/ai/explain with backend-built PathFinder context; React keeps
 * the transcript and input state only. Skill preselection (and an optional
 * drafted question) can arrive via ?skill= / ?ask= links from other pages —
 * nothing is ever sent without the user pressing Send/Explain.
 */
export default function Tutor() {
  const { learnerId, targetCareer, hoursPerWeek } = useLearner();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<string>(() => searchParams.get("ask") ?? "");
  const [skillId, setSkillId] = useState<string | null>(() => searchParams.get("skill"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<
    { question: string; skill: string | null; mode: "ask" | "explain" } | null
  >(null);
  const idRef = useRef(1);

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
    () => (Array.isArray(path.data?.recommendations) ? path.data.recommendations : []),
    [path.data],
  );
  const career = path.data?.target_career ?? null;
  // A ?skill= link may name a skill outside the open gaps; the backend (not
  // React) validates it at send time.
  const effectiveSkill = skillId;

  const appendUser = useCallback((text: string) => {
    const id = idRef.current++;
    setMessages((prev) => [...prev, { id, role: "user", text }]);
  }, []);

  const runCall = useCallback(
    async (question: string, skill: string | null, mode: "ask" | "explain") => {
      setBusy(true);
      setError(null);
      try {
        const response =
          mode === "ask"
            ? await api.tutor({
                learner_id: learnerId,
                target_career: targetCareer,
                question,
                skill_id: skill,
                hours_per_week: hoursPerWeek,
              })
            : await api.explain({
                learner_id: learnerId,
                target_career: targetCareer,
                skill_id: skill as string,
                hours_per_week: hoursPerWeek,
              });
        const id = idRef.current++;
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: "ai",
            text: response.answer,
            kind: mode === "ask" ? "answer" : "explanation",
            skillId: response.skill_id ?? skill,
            grounded: groundedSummary(response),
          },
        ]);
        setLastFailed(null);
      } catch (err) {
        setError(apiMessage(err));
        setLastFailed({ question, skill, mode });
      } finally {
        setBusy(false);
      }
    },
    [learnerId, targetCareer, hoursPerWeek],
  );

  const handleSend = useCallback(() => {
    const question = draft.trim();
    if (!question || busy) return;
    appendUser(question);
    setDraft("");
    void runCall(question, effectiveSkill, "ask");
  }, [draft, busy, appendUser, runCall, effectiveSkill]);

  const handleExplain = useCallback(() => {
    if (!effectiveSkill || busy) return;
    const label = `Explain ${humanizeSkillId(effectiveSkill)}.`;
    appendUser(label);
    void runCall(label, effectiveSkill, "explain");
  }, [effectiveSkill, busy, appendUser, runCall]);

  const handleRetry = useCallback(() => {
    if (!lastFailed || busy) return;
    appendUser(lastFailed.question);
    void runCall(lastFailed.question, lastFailed.skill, lastFailed.mode);
  }, [lastFailed, busy, appendUser, runCall]);

  let contextBlock: JSX.Element | null = null;
  if (path.loading) {
    contextBlock = <LoadingState message="Loading your learning context…" />;
  } else if (path.error) {
    const err = path.error;
    contextBlock = (
      <ErrorState
        title={
          err instanceof ApiError && (err.kind === "network" || err.kind === "timeout")
            ? "Backend unreachable"
            : "Could not load learning context"
        }
        message={apiMessage(err)}
        onRetry={path.reload}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Understand and learn"
        title="AI Tutor"
        description={
          career
            ? `Grounded in your ${career} path — mastery, gaps and roadmap included.`
            : "Grounded in your PathFinder path — mastery, gaps and roadmap included."
        }
        actions={
          <span className="badge badge--neutral">Learner #{learnerId}</span>
        }
      />

      <div className="stack-16" style={{ marginTop: 16 }}>
        {contextBlock}

        <section className="card" aria-labelledby="tutor-chat-title">
          <div className="card__title" id="tutor-chat-title">
            Conversation
          </div>

          {messages.length === 0 && !busy ? (
            <div style={{ marginTop: 12 }}>
              <EmptyState
                icon="✎"
                title="No questions yet"
                message="Ask about your learning path, or pick a suggestion below. The tutor explains PathFinder's decisions — it never changes them."
              />
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <ChatThread
                messages={messages}
                thinking={busy}
                error={error}
                onRetry={handleRetry}
                onDismissError={() => {
                  setError(null);
                  setLastFailed(null);
                }}
              />
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <span className="metric__label">Suggested questions</span>
            <div className="row" style={{ marginTop: 6 }}>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="chip chip--button"
                  disabled={busy}
                  onClick={() => setDraft(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Composer
              value={draft}
              skillId={effectiveSkill}
              options={options}
              busy={busy}
              contextFailed={path.error != null}
              onChange={setDraft}
              onSkillChange={setSkillId}
              onSend={handleSend}
              onExplain={handleExplain}
            />
          </div>
        </section>
      </div>
    </>
  );
}
