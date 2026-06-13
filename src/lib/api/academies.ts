import api from "@/api";
import type { User } from "@/types/user";

export type CoachStudentLink = {
  id: string;
  coach: User;
  student: User;
  academy: string | null;
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
