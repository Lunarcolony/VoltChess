import api from "@/api";

export type Annotation = {
  id: string;
  game: string;
  author: { id: string; username: string };
  move_index: number;
  fen: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export async function fetchAnnotations(gameId: string): Promise<Annotation[]> {
  const res = await api.get<Annotation[]>("/api/annotations/", {
    params: { game_id: gameId },
  });
  return res.data;
}

export async function createAnnotation(data: {
  game: string;
  move_index: number;
  fen: string;
  body: string;
}): Promise<Annotation> {
  const res = await api.post<Annotation>("/api/annotations/", data);
  return res.data;
}

export async function updateAnnotation(
  id: string,
  body: string
): Promise<Annotation> {
  const res = await api.patch<Annotation>(`/api/annotations/${id}/`, { body });
  return res.data;
}

export async function deleteAnnotation(id: string): Promise<void> {
  await api.delete(`/api/annotations/${id}/`);
}
