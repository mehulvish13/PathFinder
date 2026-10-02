/**
 * Centralized PathFinder API client.
 *
 * - All backend access goes through this module (no URLs hardcoded elsewhere).
 * - Base URL comes from VITE_API_BASE_URL (see .env.example).
 * - Failures are normalized into ApiError so the UI can render clear states
 *   without crashing the React tree.
 */
import type {
  AIExplainRequest,
  AIResponse,
  AITutorRequest,
  ActivityRequest,
  ActivityResponse,
  AdaptationResult,
  AssessmentDetail,
  AssessmentResult,
  AssessmentStartRequest,
  AssessmentStartResponse,
  AssessmentSubmitRequest,
  Certificate,
  CompleteRequest,
  CompleteResponse,
  Dashboard,
  HealthResponse,
  LearnerProgress,
  LearnerProfile,
  Notification,
  PathGenerateRequest,
  PathGenerateResponse,
  ProfileResponse,
  RecalculateRequest,
  SkillMastery,
} from "../types/api";

/** Base API URL, resolved once at module load. */
export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

/** Default request timeout in milliseconds. */
const DEFAULT_TIMEOUT_MS = 20_000;

/** Normalized error thrown by every API call. */
export class ApiError extends Error {
  readonly status?: number;
  readonly kind: "network" | "http" | "timeout" | "parse" | "unknown";

  constructor(
    message: string,
    kind: ApiError["kind"],
    status?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

function extractDetail(body: unknown): string | null {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (detail != null) return JSON.stringify(detail);
  }
  return null;
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * Low-level request helper. Throws ApiError on any failure.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  // Allow an external signal (e.g. component unmount) to abort too.
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onExternalAbort);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      // Distinguish our timeout from a caller-initiated abort.
      if (signal?.aborted) throw err;
      throw new ApiError(
        `Request to ${path} timed out after ${timeoutMs}ms`,
        "timeout",
      );
    }
    throw new ApiError(
      `Could not reach the PathFinder backend at ${API_BASE_URL}. Is it running?`,
      "network",
    );
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", onExternalAbort);
  }

  if (!response.ok) {
    let detail: string | null = null;
    try {
      detail = extractDetail(await response.json());
    } catch {
      // Response body was empty or not JSON — fall through to status text.
    }
    throw new ApiError(
      detail ?? `Request failed with status ${response.status} ${response.statusText}`,
      "http",
      response.status,
    );
  }

  // 204 No Content or truly empty bodies.
  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      `Received a malformed (non-JSON) response from ${path}`,
      "parse",
    );
  }
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>("/health", { signal });
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export function createProfile(
  profile: LearnerProfile,
  signal?: AbortSignal,
): Promise<ProfileResponse> {
  return request<ProfileResponse>("/api/profile/create", {
    method: "POST",
    body: profile,
    signal,
  });
}

export function extractProfile(
  message: string,
  signal?: AbortSignal,
): Promise<ProfileResponse> {
  return request<ProfileResponse>("/api/profile/extract", {
    method: "POST",
    body: { message },
    signal,
  });
}

/* ------------------------------------------------------------------ */
/* Path                                                                */
/* ------------------------------------------------------------------ */

export function generatePath(
  payload: PathGenerateRequest,
  signal?: AbortSignal,
): Promise<PathGenerateResponse> {
  return request<PathGenerateResponse>("/api/path/generate", {
    method: "POST",
    body: payload,
    signal,
  });
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function recordActivity(
  payload: ActivityRequest,
  signal?: AbortSignal,
): Promise<ActivityResponse> {
  return request<ActivityResponse>("/api/progress/activity", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function completeResource(
  payload: CompleteRequest,
  signal?: AbortSignal,
): Promise<CompleteResponse> {
  return request<CompleteResponse>("/api/progress/complete", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function getProgress(
  learnerId: number,
  signal?: AbortSignal,
): Promise<LearnerProgress> {
  return request<LearnerProgress>(`/api/progress/${learnerId}`, { signal });
}

export function getSkillMastery(
  learnerId: number,
  signal?: AbortSignal,
): Promise<SkillMastery[]> {
  return request<SkillMastery[]>(`/api/progress/${learnerId}/skills`, { signal });
}

export function getDashboard(
  learnerId: number,
  signal?: AbortSignal,
): Promise<Dashboard> {
  return request<Dashboard>(`/api/progress/dashboard/${learnerId}`, { signal });
}

export function getNotifications(
  learnerId: number,
  signal?: AbortSignal,
): Promise<Notification[]> {
  return request<Notification[]>(`/api/progress/notifications/${learnerId}`, {
    signal,
  });
}

export function getCertificate(
  learnerId: number,
  signal?: AbortSignal,
): Promise<Certificate> {
  return request<Certificate>(`/api/progress/certificate/${learnerId}`, { signal });
}

/* ------------------------------------------------------------------ */
/* Assessment                                                          */
/* ------------------------------------------------------------------ */

export function startAssessment(
  payload: AssessmentStartRequest,
  signal?: AbortSignal,
): Promise<AssessmentStartResponse> {
  return request<AssessmentStartResponse>("/api/assessment/start", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function submitAssessment(
  payload: AssessmentSubmitRequest,
  signal?: AbortSignal,
): Promise<AssessmentResult> {
  return request<AssessmentResult>("/api/assessment/submit", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function getAssessment(
  assessmentId: number,
  signal?: AbortSignal,
): Promise<AssessmentDetail> {
  return request<AssessmentDetail>(`/api/assessment/${assessmentId}`, { signal });
}

export function getAssessmentResult(
  assessmentId: number,
  signal?: AbortSignal,
): Promise<AssessmentResult> {
  return request<AssessmentResult>(`/api/assessment/${assessmentId}/result`, { signal });
}

/* ------------------------------------------------------------------ */
/* Adaptation                                                          */
/* ------------------------------------------------------------------ */

export function recalculate(
  payload: RecalculateRequest,
  signal?: AbortSignal,
): Promise<AdaptationResult> {
  return request<AdaptationResult>("/api/adaptation/recalculate", {
    method: "POST",
    body: payload,
    signal,
  });
}

/* ------------------------------------------------------------------ */
/* AI Tutor                                                            */
/* ------------------------------------------------------------------ */

export function explain(
  payload: AIExplainRequest,
  signal?: AbortSignal,
): Promise<AIResponse> {
  return request<AIResponse>("/api/ai/explain", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function tutor(
  payload: AITutorRequest,
  signal?: AbortSignal,
): Promise<AIResponse> {
  return request<AIResponse>("/api/ai/tutor", {
    method: "POST",
    body: payload,
    signal,
  });
}

/** Convenience namespace so callers can `import { api } from ".../api"`. */
export const api = {
  API_BASE_URL,
  ApiError,
  getHealth,
  createProfile,
  extractProfile,
  generatePath,
  recordActivity,
  completeResource,
  getProgress,
  getSkillMastery,
  getDashboard,
  getNotifications,
  getCertificate,
  startAssessment,
  submitAssessment,
  getAssessment,
  getAssessmentResult,
  recalculate,
  explain,
  tutor,
};

export default api;
