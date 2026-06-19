import api from "@/api";
import type { GameEval } from "@/types/eval";

export type ServerGame = {
  id: string;
  pgn: string;
  white: { name: string; rating?: number };
  black: { name: string; rating?: number };
  result?: string;
  date?: string;
  event?: string;
  site?: string;
  round?: string;
  has_eval: boolean;
  accuracy?: { white?: number; black?: number };
  source?: string;
  analysis_status?: "pending" | "in_progress" | "complete" | "failed";
  analysis_source?: "browser" | "server" | "";
  external_url?: string;
  created_at: string;
};

export type ServerGameEval = {
  id: string;
  positions: GameEval["positions"];
  accuracy: GameEval["accuracy"];
  estimated_elo?: GameEval["estimatedElo"];
  settings: GameEval["settings"];
  created_at: string;
  updated_at: string;
};

export type ServerGameDetail = ServerGame & {
  eval?: ServerGameEval;
  termination?: string;
  time_control?: string;
  updated_at?: string;
};

export async function fetchGames(studentId?: string): Promise<ServerGame[]> {
  const params = studentId ? { student_id: studentId } : undefined;
  const res = await api.get<ServerGame[]>("/api/games/", { params });
  return res.data;
}

export async function fetchGame(gameId: string): Promise<ServerGameDetail> {
  const res = await api.get<ServerGameDetail>(`/api/games/${gameId}/`);
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
  game: Omit<ServerGame, "id" | "has_eval" | "created_at"> & {
    termination?: string;
    time_control?: string;
  }
): Promise<ServerGame> {
  const res = await api.post<ServerGame>("/api/games/", game);
  return res.data;
}

export async function deleteServerGame(gameId: string): Promise<void> {
  await api.delete(`/api/games/${gameId}/`);
}

export async function bulkUploadGames(
  games: Array<Record<string, unknown>>
): Promise<{ created: string[] }> {
  const res = await api.post<{ created: string[] }>("/api/games/bulk/", {
    games,
  });
  return res.data;
}
