/** Display helpers. These only format backend values — they never compute them. */

/** Badge styling for a backend `importance` value (presentation only). */
export function importanceBadgeClass(
  importance: string | null | undefined,
): string {
  switch ((importance ?? "").toLowerCase()) {
    case "critical":
      return "badge badge--danger";
    case "high":
      return "badge badge--warning";
    case "medium":
      return "badge badge--info";
    default:
      return "badge badge--neutral";
  }
}

/** Badge styling for a backend `readiness`/`status` value. */
export function readinessBadgeClass(
  status: string | null | undefined,
): string {
  switch ((status ?? "").toLowerCase()) {
    case "ready":
      return "badge badge--success";
    case "blocked":
      return "badge badge--danger";
    default:
      return "badge badge--warning";
  }
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatHours(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}h`;
}

/**
 * Display casing for well-known technical acronyms so skill ids read like
 * "LLM Fundamentals" instead of "Llm Fundamentals". Pure formatting — the
 * underlying value always comes from the backend.
 */
const ACRONYMS: Record<string, string> = {
  AI: "AI",
  API: "API",
  CUDA: "CUDA",
  GENAI: "GenAI",
  GPU: "GPU",
  LLM: "LLM",
  ML: "ML",
  NLP: "NLP",
  RAG: "RAG",
  SQL: "SQL",
};

export function humanizeSkillId(skillId: string | null | undefined): string {
  if (!skillId) return "Unknown skill";
  return skillId
    .replace(/[_-]+/g, " ")
    .split(" ")
    .map((word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS[upper]) return ACRONYMS[upper];
      return word.replace(/\b\w/, (c) => c.toUpperCase());
    })
    .join(" ");
}

export function humanizeCareerId(careerId: string | null | undefined): string {
  return humanizeSkillId(careerId);
}

/**
 * Formats a mastery distance in "points" (backend values are 0..100, so the
 * gap field is already computed server-side — this only rounds for display).
 */
export function formatPoints(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)} points`;
}

/** Clamps a backend 0..100 value so a bar can never overflow its track. */
export function clampPercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Cleans up backend action strings such as "Start learning llm_fundamentals."
 * by humanizing embedded snake_case skill ids. The sentence itself is left
 * untouched — this is presentation only.
 */
export function formatAction(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g, (id) =>
    humanizeSkillId(id),
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
