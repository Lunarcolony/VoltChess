import api from "@/api";
import type { Assignment } from "@/lib/api/assignments";

export type CoachDashboard = {
  summary: {
    students: number;
    assignments_total: number;
    assignments_pending: number;
    assignments_in_progress: number;
    assignments_overdue: number;
    assignments_due_soon: number;
    active_training_plans: number;
    unread_messages: number;
    analyzed_games_total: number;
  };
  roster: RosterEntry[];
  at_risk: (RosterEntry & { reasons: string[] })[];
  activity: ActivityItem[];
};

export type RosterEntry = {
  link_id: string;
  student: { id: string; username: string; email: string };
  stats: import("@/lib/api/academies").StudentStats;
  engagement_score: number;
  games_this_week: number;
  avg_accuracy: number | null;
  tags: string[];
  priority: "low" | "normal" | "high";
  pinned: boolean;
  target_accuracy: number | null;
  weekly_game_goal: number | null;
  coach_notes_preview: string;
  days_inactive: number | null;
  last_reviewed_at: string | null;
};

export type ActivityItem = {
  type: string;
  at: string;
  student_username: string;
  student_id: string;
  summary: string;
};

export type CoachAnalytics = {
  cohort_avg_accuracy: number | null;
  accuracy_by_student: Array<{
    username: string;
    student_id: string;
    accuracy: number | null;
    blunders: number;
  }>;
  mistake_totals: Record<string, number>;
  assignment_categories: Record<string, number>;
  assignment_status: Array<{ status: string; count: number }>;
  top_opening_events: Array<[string, number]>;
};

export type LessonTemplate = {
  id: string;
  title: string;
  category: string;
  instructions: string;
  pgn: string;
  estimated_minutes: number | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type CoachMessage = {
  id: string;
  coach_username: string;
  student: string;
  student_username: string;
  subject: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type TrainingPlan = {
  id: string;
  student: string;
  student_username: string;
  title: string;
  description: string;
  status: "active" | "completed" | "paused";
  target_weeks: number;
  goals: Array<{ week?: number; text: string; done?: boolean }>;
  created_at: string;
  updated_at: string;
};

export type StudentTimeline = {
  weekly_games: Array<{ week_start: string; games: number }>;
  timeline: Array<{
    type: string;
    at: string;
    title: string;
    meta: Record<string, unknown>;
  }>;
};

export async function fetchCoachDashboard(): Promise<CoachDashboard> {
  const res = await api.get<CoachDashboard>("/api/coach/dashboard/");
  return res.data;
}

export async function fetchCoachAnalytics(): Promise<CoachAnalytics> {
  const res = await api.get<CoachAnalytics>("/api/coach/analytics/");
  return res.data;
}

export async function fetchLessonTemplates(): Promise<LessonTemplate[]> {
  const res = await api.get<LessonTemplate[]>("/api/lesson-templates/");
  return res.data;
}

export async function createLessonTemplate(
  data: Omit<LessonTemplate, "id" | "created_at" | "updated_at">
): Promise<LessonTemplate> {
  const res = await api.post<LessonTemplate>("/api/lesson-templates/", data);
  return res.data;
}

export async function updateLessonTemplate(
  id: string,
  data: Partial<LessonTemplate>
): Promise<LessonTemplate> {
  const res = await api.patch<LessonTemplate>(
    `/api/lesson-templates/${id}/`,
    data
  );
  return res.data;
}

export async function deleteLessonTemplate(id: string): Promise<void> {
  await api.delete(`/api/lesson-templates/${id}/`);
}

export async function fetchCoachMessages(): Promise<CoachMessage[]> {
  const res = await api.get<CoachMessage[]>("/api/coach-messages/");
  return res.data;
}

export async function sendCoachMessage(data: {
  student_id: string;
  subject: string;
  body: string;
}): Promise<CoachMessage> {
  const res = await api.post<CoachMessage>("/api/coach-messages/", data);
  return res.data;
}

export async function fetchTrainingPlans(): Promise<TrainingPlan[]> {
  const res = await api.get<TrainingPlan[]>("/api/training-plans/");
  return res.data;
}

export async function createTrainingPlan(data: {
  student_id: string;
  title: string;
  description?: string;
  target_weeks?: number;
  goals?: TrainingPlan["goals"];
}): Promise<TrainingPlan> {
  const res = await api.post<TrainingPlan>("/api/training-plans/", data);
  return res.data;
}

export async function updateTrainingPlan(
  id: string,
  data: Partial<TrainingPlan>
): Promise<TrainingPlan> {
  const res = await api.patch<TrainingPlan>(`/api/training-plans/${id}/`, data);
  return res.data;
}

export async function fetchStudentTimeline(
  studentId: string
): Promise<StudentTimeline> {
  const res = await api.get<StudentTimeline>(
    `/api/students/${studentId}/timeline/`
  );
  return res.data;
}

export async function bulkCreateAssignments(data: {
  student_ids: string[];
  title?: string;
  instructions: string;
  pgn?: string;
  due_date?: string;
  category?: string;
  priority?: string;
}): Promise<Assignment[]> {
  const res = await api.post<Assignment[]>("/api/assignments/bulk/", data);
  return res.data;
}
