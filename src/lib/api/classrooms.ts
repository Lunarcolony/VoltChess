import api from "@/api";

export type Classroom = {
  id: string;
  name: string;
  join_code: string;
  is_active: boolean;
  coach_username: string;
  student_count: number;
  created_at: string;
  updated_at: string;
};

export type ClassroomPreview = {
  join_code: string;
  classroom_name: string;
  coach_username: string;
  already_member: boolean;
};

export type JoinClassroomResult = {
  created: boolean;
  coach_username: string;
  classroom_name: string;
  link_id: string;
};

export async function fetchMyClassroom(): Promise<Classroom> {
  const res = await api.get<Classroom>("/api/classroom/mine/");
  return res.data;
}

export async function updateMyClassroom(data: {
  name?: string;
  is_active?: boolean;
}): Promise<Classroom> {
  const res = await api.patch<Classroom>("/api/classroom/mine/", data);
  return res.data;
}

export async function regenerateClassroomCode(): Promise<Classroom> {
  const res = await api.post<Classroom>("/api/classroom/regenerate/");
  return res.data;
}

export async function previewClassroomJoin(
  join_code: string
): Promise<ClassroomPreview> {
  const res = await api.post<ClassroomPreview>("/api/classroom/preview/", {
    join_code,
  });
  return res.data;
}

export async function joinClassroom(
  join_code: string
): Promise<JoinClassroomResult> {
  const res = await api.post<JoinClassroomResult>("/api/classroom/join/", {
    join_code,
  });
  return res.data;
}
