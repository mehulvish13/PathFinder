import { humanizeSkillId } from "../../utils/format";
import type { Recommendation } from "../../types/api";

interface ComposerProps {
  value: string;
  skillId: string | null;
  options: Recommendation[];
  busy: boolean;
  contextFailed: boolean;
  onChange: (value: string) => void;
  onSkillChange: (skillId: string | null) => void;
  onSend: () => void;
  onExplain: () => void;
}

/**
 * Question input with optional skill context. Empty questions never reach
 * the API (the backend would 422 them); skill selection only scopes the
 * context the backend builds, never any React-side decision.
 */
export function Composer({
  value,
  skillId,
  options,
  busy,
  contextFailed,
  onChange,
  onSkillChange,
  onSend,
  onExplain,
}: ComposerProps) {
  const canSend = value.trim().length > 0 && !busy;

  return (
    <div className="composer">
      <label className="form-field">
        <span className="metric__label">Skill context (optional)</span>
        <select
          className="input"
          value={skillId ?? ""}
          disabled={busy || options.length === 0}
          onChange={(event) => onSkillChange(event.target.value || null)}
        >
          <option value="">General — whole learning path</option>
          {options.map((rec) => (
            <option key={rec.skill_id} value={rec.skill_id}>
              {humanizeSkillId(rec.skill_id)}
            </option>
          ))}
        </select>
      </label>
      {contextFailed ? (
        <p className="subtle">
          Skill list unavailable (backend error) — general questions still work.
        </p>
      ) : null}

      <label className="form-field">
        <span className="metric__label">Your question</span>
        <textarea
          className="input composer__input"
          rows={3}
          maxLength={2000}
          placeholder="Ask about your learning path…"
          value={value}
          disabled={busy}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              if (canSend) onSend();
            }
          }}
        />
      </label>

      <div className="row">
        <button
          type="button"
          className="button"
          disabled={!canSend}
          onClick={onSend}
        >
          {busy ? "Sending…" : "Send"}
        </button>
        <button
          type="button"
          className="button button--secondary"
          disabled={busy || !skillId}
          title={skillId ? "Explain the selected skill" : "Select a skill first"}
          onClick={onExplain}
        >
          Explain This Skill
        </button>
      </div>
    </div>
  );
}
