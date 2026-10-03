import { humanizeSkillId } from "../../utils/format";

/** One chat entry. AI entries optionally carry their grounding summary. */
export interface ChatMessage {
  id: number;
  role: "user" | "ai";
  text: string;
  /** "answer" (tutor) or "explanation" (explain endpoint). */
  kind?: "answer" | "explanation";
  skillId?: string | null;
  grounded?: {
    career: string;
    openGaps: number;
    selectedMastery?: number | null;
    selectedGap?: number | null;
  } | null;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  thinking: boolean;
  error: string | null;
  onRetry: () => void;
  onDismissError: () => void;
}

/**
 * Conversation rendering. AI text is shown verbatim with preserved line
 * breaks — React never reformats, summarizes or second-guesses the answer.
 * Each AI message names the backend state it was grounded in.
 */
export function ChatThread({ messages, thinking, error, onRetry, onDismissError }: ChatThreadProps) {
  return (
    <div className="chat-thread" aria-live="polite">
      {messages.map((message) =>
        message.role === "user" ? (
          <div className="chat-bubble chat-bubble--user" key={message.id}>
            {message.text}
          </div>
        ) : (
          <div className="chat-bubble chat-bubble--ai" key={message.id}>
            <div className="chat-bubble__label">
              {message.kind === "explanation" ? "Explanation" : "AI Tutor"}
              {message.skillId ? ` · ${humanizeSkillId(message.skillId)}` : null}
            </div>
            <p className="chat-bubble__text">{message.text}</p>
            {message.grounded ? (
              <p className="chat-grounding">
                Grounded in {message.grounded.career} state ·{" "}
                {message.grounded.openGaps} open gaps
                {message.grounded.selectedMastery != null &&
                message.grounded.selectedGap != null
                  ? ` · selected skill ${message.grounded.selectedMastery}% mastery, ${message.grounded.selectedGap} gap`
                  : null}
                .
              </p>
            ) : null}
          </div>
        ),
      )}

      {thinking ? (
        <div className="chat-bubble chat-bubble--ai" aria-label="Waiting for AI response">
          <div className="chat-bubble__label">AI Tutor</div>
          <p className="chat-thinking">
            <span className="chat-thinking__dot" aria-hidden="true" />
            Thinking with your PathFinder context…
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="notice notice--error" role="alert">
          {error}{" "}
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={onRetry}
          >
            Retry
          </button>{" "}
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={onDismissError}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
