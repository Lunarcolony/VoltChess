import api from "@/api";
import type { User } from "@/types/user";

export type CoachStudentLink = {
  id: string;
  coach: User;
  student: User;
  academy: string | null;
  coach_notes: string;
  tags: string[];
  priority: "low" | "normal" | "high";
  target_accuracy: number | null;
  weekly_game_goal: number | null;
  pinned: boolean;
  last_reviewed_at: string | null;
  created_at: string;
};

export type StudentStats = {
  student_id: string;
  username: string;
  total_games: number;
  analyzed_games: number;
  avg_accuracy_white: number | null;
  avg_accuracy_black: number | null;
  blunders: { white: number; black: number };
  mistakes: { white: number; black: number };
  pending_assignments: number;
};

export function avgAccuracy(stats: StudentStats): number | null {
  const vals = [stats.avg_accuracy_white, stats.avg_accuracy_black].filter(
    (v): v is number => v != null
  );
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export async function fetchCoachLinks(): Promise<CoachStudentLink[]> {
  const res = await api.get<CoachStudentLink[]>("/api/coach-links/");
  return res.data;
}

export async function createCoachLink(data: {
  student_username?: string;
  student_id?: string;
}): Promise<CoachStudentLink> {
  const res = await api.post<CoachStudentLink>("/api/coach-links/", data);
  return res.data;
}

export async function updateCoachLink(
  id: string,
  data: Partial<
    Pick<
      CoachStudentLink,
      | "coach_notes"
      | "tags"
      | "priority"
      | "target_accuracy"
      | "weekly_game_goal"
      | "pinned"
      | "last_reviewed_at"
    >
  >
): Promise<CoachStudentLink> {
  const res = await api.patch<CoachStudentLink>(`/api/coach-links/${id}/`, data);
  return res.data;
}

export async function deleteCoachLink(id: string): Promise<void> {
  await api.delete(`/api/coach-links/${id}/`);
}

export async function fetchStudentStats(
  studentId: string
): Promise<StudentStats> {
  const res = await api.get<StudentStats>(`/api/students/${studentId}/stats/`);
  return res.data;
}

export async function fetchAcademies() {
  const res = await api.get("/api/academies/");
  return res.data;
}

export type StudentReport = {
  student: { id: string; username: string; email: string };
  summary: StudentStats;
  games: Array<{
    game_id: string;
    date?: string;
    white: { name: string };
    black: { name: string };
    result?: string;
    has_eval: boolean;
    accuracy?: Record<string, number>;
    classifications?: Record<string, { white: number; black: number }>;
    move_count?: number;
  }>;
  assignments: Array<{
    id: string;
    status: string;
    instructions: string;
    due_date: string | null;
    coach: string;
  }>;
  generated_at: string;
};

export async function fetchStudentReport(
  studentId: string,
  from?: string,
  to?: string
): Promise<StudentReport> {
  const res = await api.get<StudentReport>(`/api/students/${studentId}/report/`, {
    params: { from, to },
  });
  return res.data;
}
