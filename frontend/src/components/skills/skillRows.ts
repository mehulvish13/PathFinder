import type {
  MilestoneRecord,
  PathResource,
  Recommendation,
  RoadmapSkill,
  SkillMastery,
} from "../../types/api";

/** One row in the skills workspace: a presentation join of backend records. */
export interface SkillRow {
  skill_id: string;
  current: number | null;
  required: number | null;
  gap: number | null;
  importance: string | null;
  priority: number | null;
  /** Backend-derived state. Never a React-invented classification. */
  state: "mastered" | "gap";
  /** Status string from the recorded-mastery endpoint, when present. */
  recordStatus: string | null;
  /** Readiness/status from the learning-path step, when present. */
  stepStatus: string | null;
  prerequisites: string[];
  resources: PathResource[];
}

export interface SkillsIndex {
  rows: SkillRow[];
  byId: Map<string, SkillRow>;
  historyBySkill: Map<string, MilestoneRecord[]>;
}

/**
 * Joins backend records into display rows. Gap, importance, priority and
 * readiness all come from the backend gap/recommendation engine; this only
 * groups records that share a skill id. Career-specific required mastery is
 * preferred (recommendations); the recorded-mastery endpoint is the fallback.
 */
export function buildSkillsIndex(
  recommendations: Recommendation[],
  clearedSkills: string[],
  masteryRecords: SkillMastery[],
  phaseSteps: RoadmapSkill[],
  milestones: MilestoneRecord[],
): SkillsIndex {
  const byId = new Map<string, SkillRow>();

  const ensure = (skill_id: string): SkillRow => {
    let row = byId.get(skill_id);
    if (!row) {
      row = {
        skill_id,
        current: null,
        required: null,
        gap: null,
        importance: null,
        priority: null,
        state: "gap",
        recordStatus: null,
        stepStatus: null,
        prerequisites: [],
        resources: [],
      };
      byId.set(skill_id, row);
    }
    return row;
  };

  for (const rec of recommendations) {
    const row = ensure(rec.skill_id);
    row.current = rec.current_mastery;
    row.required = rec.required_mastery;
    row.gap = rec.gap;
    row.importance = rec.importance;
    row.priority = rec.priority_score;
    row.state = "gap";
  }

  for (const record of masteryRecords) {
    const row = ensure(record.skill_id);
    // Recorded values only fill blanks: the career-specific recommendation
    // stays authoritative whenever the skill is an open gap.
    if (row.current == null) row.current = record.current_mastery;
    if (row.required == null) row.required = record.target_mastery;
    if (row.gap == null) row.gap = record.gap;
    row.recordStatus = record.status;
  }

  for (const step of phaseSteps) {
    const row = ensure(step.skill_id);
    row.stepStatus = step.status ?? row.stepStatus;
    if (Array.isArray(step.prerequisites) && step.prerequisites.length > 0) {
      row.prerequisites = step.prerequisites;
    }
    if (Array.isArray(step.resources) && step.resources.length > 0) {
      row.resources = step.resources;
    }
  }

  const cleared = new Set(clearedSkills);
  for (const skill_id of cleared) {
    ensure(skill_id).state = "mastered";
  }

  const historyBySkill = new Map<string, MilestoneRecord[]>();
  for (const event of milestones) {
    const list = historyBySkill.get(event.skill_id) ?? [];
    list.push(event);
    historyBySkill.set(event.skill_id, list);
  }
  for (const list of historyBySkill.values()) {
    list.sort((a, b) => String(b.recorded_at ?? "").localeCompare(String(a.recorded_at ?? "")));
  }

  // Backend order is priority-ranked; preserve it (no React re-ranking).
  const order = new Map(recommendations.map((rec, index) => [rec.skill_id, index]));
  const rows = [...byId.values()].sort((a, b) => {
    if (a.state !== b.state) return a.state === "gap" ? -1 : 1;
    const ao = order.get(a.skill_id) ?? Number.MAX_SAFE_INTEGER;
    const bo = order.get(b.skill_id) ?? Number.MAX_SAFE_INTEGER;
    return ao - bo;
  });

  return { rows, byId, historyBySkill };
}
