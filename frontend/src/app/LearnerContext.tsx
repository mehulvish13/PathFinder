import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const LEARNER_ID_KEY = "pathfinder.learnerId";
const CAREER_KEY = "pathfinder.targetCareer";
const HOURS_KEY = "pathfinder.hoursPerWeek";

const DEFAULT_LEARNER_ID = 1;
const DEFAULT_CAREER = "genai_engineer";
const DEFAULT_HOURS = 10;

interface LearnerContextValue {
  learnerId: number;
  setLearnerId: (id: number) => void;
  targetCareer: string;
  setTargetCareer: (career: string) => void;
  hoursPerWeek: number;
  setHoursPerWeek: (hours: number) => void;
}

const LearnerContext = createContext<LearnerContextValue | null>(null);

function readNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = raw == null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readString(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

/**
 * Holds the active learner identity used by every API call. Phase 8A has no
 * auth flow yet, so this is a small local selection persisted in localStorage.
 */
export function LearnerProvider({ children }: { children: ReactNode }) {
  const [learnerId, setLearnerIdState] = useState<number>(() =>
    readNumber(LEARNER_ID_KEY, DEFAULT_LEARNER_ID),
  );
  const [targetCareer, setTargetCareerState] = useState<string>(() =>
    readString(CAREER_KEY, DEFAULT_CAREER),
  );
  const [hoursPerWeek, setHoursPerWeekState] = useState<number>(() =>
    readNumber(HOURS_KEY, DEFAULT_HOURS),
  );

  const setLearnerId = useCallback((id: number) => {
    const safe = Number.isFinite(id) && id > 0 ? Math.floor(id) : DEFAULT_LEARNER_ID;
    setLearnerIdState(safe);
    window.localStorage.setItem(LEARNER_ID_KEY, String(safe));
  }, []);

  const setTargetCareer = useCallback((career: string) => {
    const safe = career.trim() || DEFAULT_CAREER;
    setTargetCareerState(safe);
    window.localStorage.setItem(CAREER_KEY, safe);
  }, []);

  const setHoursPerWeek = useCallback((hours: number) => {
    const safe = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_HOURS;
    setHoursPerWeekState(safe);
    window.localStorage.setItem(HOURS_KEY, String(safe));
  }, []);

  const value = useMemo<LearnerContextValue>(
    () => ({
      learnerId,
      setLearnerId,
      targetCareer,
      setTargetCareer,
      hoursPerWeek,
      setHoursPerWeek,
    }),
    [learnerId, setLearnerId, targetCareer, setTargetCareer, hoursPerWeek, setHoursPerWeek],
  );

  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>;
}

export function useLearner(): LearnerContextValue {
  const ctx = useContext(LearnerContext);
  if (!ctx) {
    throw new Error("useLearner must be used within a LearnerProvider");
  }
  return ctx;
}
