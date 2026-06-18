import api from "@/api";

export type Assignment = {
  id: string;
  coach: { id: string; username: string };
  student: { id: string; username: string };
  title: string;
  instructions: string;
  category: string;
  priority: "low" | "normal" | "high";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date: string | null;
  pgn: string;
  created_at: string;
  updated_at: string;
};

export async function fetchAssignments(): Promise<Assignment[]> {
  const res = await api.get<Assignment[]>("/api/assignments/");
  return res.data;
}

export async function createAssignment(data: {
  student_id: string;
  instructions: string;
  title?: string;
  due_date?: string;
  pgn?: string;
  category?: string;
  priority?: string;
  game_id?: string;
}): Promise<Assignment> {
  const res = await api.post<Assignment>("/api/assignments/", data);
  return res.data;
}

export async function updateAssignment(
  id: string,
  data: Partial<{
    title: string;
    instructions: string;
    status: Assignment["status"];
    due_date: string;
    pgn: string;
    category: string;
    priority: string;
  }>
): Promise<Assignment> {
  const res = await api.patch<Assignment>(`/api/assignments/${id}/`, data);
  return res.data;
}
