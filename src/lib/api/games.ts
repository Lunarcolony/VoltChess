import api from "@/api";

export type ServerGame = {
  id: string;
  pgn: string;
  white: { name: string; rating?: number };
  black: { name: string; rating?: number };
  result?: string;
  date?: string;
  has_eval: boolean;
  accuracy?: { white?: number; black?: number };
  source?: string;
  created_at: string;
};

export async function fetchGames(studentId?: string): Promise<ServerGame[]> {
  const params = studentId ? { student_id: studentId } : undefined;
  const res = await api.get<ServerGame[]>("/api/games/", { params });
  return res.data;
}

export async function uploadGameEval(
  gameId: string,
  evalData: {
    positions: unknown[];
    accuracy: Record<string, unknown>;
    estimated_elo?: Record<string, unknown>;
    settings: Record<string, unknown>;
  }
) {
  const res = await api.put(`/api/games/${gameId}/eval/`, evalData);
  return res.data;
}

export async function createGame(
  game: Omit<ServerGame, "id" | "has_eval" | "created_at">
): Promise<ServerGame> {
  const res = await api.post<ServerGame>("/api/games/", game);
  return res.data;
}
