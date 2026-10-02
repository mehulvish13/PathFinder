/**
 * PathFinder frontend API types.
 *
 * These mirror the ACTUAL FastAPI response shapes (pydantic schemas + service
 * return dictionaries). They are intentionally hand-written rather than copied
 * from backend ORM models, because the API response envelope differs from the
 * database models. The frontend never derives these values itself — it only
 * displays backend-computed results.
 */

/* ------------------------------------------------------------------ */
/* Profile (backend/app/schemas/profile.py)                            */
/* ------------------------------------------------------------------ */

export interface LearnerSkill {
  skill_id: string;
  mastery: number; // 0..100
  confidence: number; // 0..1
}

export interface LearnerProfile {
  name?: string | null;
  target_career: string;
  goal_description?: string | null;
  experience_level?: string | null;
  skills: LearnerSkill[];
  completed_courses: string[];
  completed_projects: string[];
  interests: string[];
  hours_per_week?: number | null;
  deadline?: string | null;
  learning_preference?: string | null;
}

export interface ProfileResponse {
  message: string;
  profile: LearnerProfile;
}

/* ------------------------------------------------------------------ */
/* Skill gaps / recommendations / learning path                        */
/* (skill_gap_service, recommendation_service, path_generator)         */
/* ------------------------------------------------------------------ */

export type Importance = "critical" | "high" | "medium" | "low";
export type Readiness = "ready" | "blocked" | string;

export interface SkillGap {
  skill_id: string;
  current_mastery: number;
  required_mastery: number;
  gap: number;
  importance: Importance;
  priority_score: number;
}

export interface Recommendation {
  skill_id: string;
  current_mastery: number;
  required_mastery: number;
  gap: number;
  importance: Importance;
  priority_score: number;
  prerequisites: string[];
  blocked_by: string[];
  readiness: Readiness;
}

/** A matched resource returned inside a learning-path step. */
export interface PathResource {
  id: string;
  title: string;
  type: string; // course | tutorial | documentation | project | assessment
  skill_id: string;
  difficulty: string; // beginner | intermediate | advanced
  estimated_hours: number;
  url?: string | null;
  description: string;
  tags: string[];
  recommendation_score: number;
}

export interface LearningPathStep {
  skill: string;
  skill_id: string;
  status: Readiness; // ready | blocked
  current_mastery?: number;
  required_mastery?: number;
  gap?: number;
  priority: number;
  resources: PathResource[];
  prerequisites?: string[];
}

export interface LearningPathPhase {
  phase: number;
  description: string;
  skills: Array<{
    skill: string;
    priority: number;
    prerequisite_depth: number;
  }>;
}

export interface LearningPath {
  learning_path: LearningPathStep[];
  phases: LearningPathPhase[];
  total_skills: number;
  ready_skills: number;
  blocked_skills: number;
}

/* ------------------------------------------------------------------ */
/* Roadmap (backend/app/schemas/roadmap.py + roadmap_generator)         */
/* ------------------------------------------------------------------ */

export interface RoadmapResource {
  resource_id: string;
  title: string;
  type: string;
  estimated_hours: number;
}

/**
 * Roadmap phase skills carry the raw learning-path step payload from the
 * generator, so most fields are optional here. The frontend renders whatever
 * the backend supplies and never recomputes ordering.
 */
export interface RoadmapSkill {
  skill_id: string;
  skill?: string;
  current_mastery?: number;
  target_mastery?: number;
  required_mastery?: number;
  gap?: number;
  status?: Readiness;
  priority?: number;
  resources?: PathResource[];
  prerequisites?: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  skills: string[];
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  skills: RoadmapSkill[];
  milestone: Milestone;
  estimated_hours: number;
}

export interface Roadmap {
  title: string;
  target_career: string;
  total_estimated_hours: number;
  estimated_weeks?: number | null;
  phases: RoadmapPhase[];
  next_action: string;
}

/* ------------------------------------------------------------------ */
/* Path generation (POST /api/path/generate)                            */
/* ------------------------------------------------------------------ */

export interface PathGenerateRequest {
  current_skills: Record<string, number>;
  career_requirements: Array<{
    skill_id: string;
    required_mastery: number;
    importance?: Importance;
  }>;
  prerequisites: Array<Record<string, string>>;
  learner_level?: string;
  learning_preference?: string | null;
  max_hours?: number | null;
  resource_limit?: number;
  target_career?: string | null;
  hours_per_week?: number;
}

export interface PathGenerateResponse {
  skill_gaps: SkillGap[];
  recommendations: Recommendation[];
  learning_path: LearningPath;
  roadmap: Roadmap;
}

/* ------------------------------------------------------------------ */
/* Progress (backend/app/schemas/progress.py)                           */
/* ------------------------------------------------------------------ */

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export type MasteryStatus = "ready" | "in_progress" | "blocked" | string;

export interface MilestoneRecord {
  skill_id: string;
  mastery: number;
  source: string;
  recorded_at: string | null;
}

export interface SkillMastery {
  skill_id: string;
  skill_name: string;
  current_mastery: number;
  target_mastery: number;
  gap: number;
  status: MasteryStatus;
}

export interface LearnerProgress {
  learner_id: number;
  overall_progress: number;
  total_resources: number;
  completed_resources: number;
  in_progress_resources: number;
  not_started_resources: number;
  milestones: MilestoneRecord[];
  next_action: string;
}

export interface Dashboard {
  learner_id: number;
  overall_progress: number;
  progress_bar: string;
  total_resources: number;
  completed_resources: number;
  in_progress_resources: number;
  not_started_resources: number;
  skill_mastery: SkillMastery[];
  milestones: MilestoneRecord[];
  next_action: string;
  estimated_time_remaining: number;
  hours_per_week?: number;
}

export interface Notification {
  id: number;
  learner_id: number;
  title: string;
  message: string;
  type: string; // next_action | milestone | reminder | streak
  is_read: boolean;
  created_at: string | null;
}

export interface Certificate {
  learner_name: string;
  target_career: string;
  completion_percent: number;
  skills_completed: string[];
  completion_date: string;
  certificate_id: string;
  verified: boolean;
}

export interface ActivityRequest {
  learner_id: number;
  resource_id: string;
  activity_type: string;
}

export interface CompleteRequest {
  learner_id: number;
  resource_id: string;
}

export interface ActivityResponse {
  message: string;
  activity_id: number;
  activity_type: string;
  started_at: string | null;
}

export interface CompleteResponse {
  message: string;
  resource_id: string;
  progress_percent: number;
  status: ProgressStatus;
}

/* ------------------------------------------------------------------ */
/* Assessment (backend/app/schemas/assessment.py)                       */
/* ------------------------------------------------------------------ */

export interface AssessmentStartRequest {
  learner_id: number;
  skill_id: string;
  num_questions?: number; // 1..10
  required_mastery?: number; // 0..100
}

export interface QuestionPublic {
  question_id: string;
  skill_id: string;
  question: string;
  options: string[];
  difficulty: string;
}

export interface AssessmentStartResponse {
  assessment_id: number;
  learner_id: number;
  skill_id: string;
  num_questions: number;
  questions: QuestionPublic[];
}

export interface AnswerItem {
  question_id: string;
  selected_index: number;
}

export interface AssessmentSubmitRequest {
  assessment_id: number;
  answers: AnswerItem[];
  target_career?: string | null;
  hours_per_week?: number;
}

export interface QuestionFeedback {
  question_id: string;
  correct: boolean;
  selected_index?: number | null;
  correct_index: number;
  explanation: string;
}

export interface AssessmentResult {
  assessment_id: number;
  learner_id: number;
  skill_id: string;
  correct: number;
  incorrect: number;
  total: number;
  percentage: number;
  previous_mastery: number;
  new_mastery: number;
  required_mastery: number;
  gap_before: number;
  gap_after: number;
  status: "ready" | "needs_work" | string;
  feedback: QuestionFeedback[];
  adaptation?: AdaptationResult | null;
}

export interface AssessmentDetail {
  assessment_id: number;
  learner_id: number;
  skill_id: string;
  status: "started" | "submitted" | string;
  num_questions: number;
  questions: QuestionPublic[];
  percentage?: number | null;
  submitted_at?: string | null;
}

/* ------------------------------------------------------------------ */
/* Adaptation (backend/app/schemas/adaptation.py)                      */
/* ------------------------------------------------------------------ */

export interface RecalculateRequest {
  learner_id: number;
  target_career: string;
  hours_per_week?: number;
}

export interface AdaptationResult {
  learner_id: number;
  career_id: string;
  target_career: string;
  hours_per_week: number;
  cleared_skills: string[];
  skill_gaps: SkillGap[];
  recommendations: Recommendation[];
  learning_path: LearningPath;
  roadmap: Roadmap;
}

/* ------------------------------------------------------------------ */
/* AI Tutor (backend/app/schemas/ai_tutor.py)                          */
/* ------------------------------------------------------------------ */

export interface AIExplainRequest {
  learner_id: number;
  target_career: string;
  skill_id: string;
  hours_per_week?: number;
  focus?: string | null;
}

export interface AITutorRequest {
  learner_id: number;
  target_career: string;
  question: string;
  skill_id?: string | null;
  hours_per_week?: number;
}

export interface AIResponse {
  learner_id: number;
  target_career: string;
  skill_id?: string | null;
  answer: string;
  context: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* Health                                                               */
/* ------------------------------------------------------------------ */

export interface HealthResponse {
  status: string;
}
