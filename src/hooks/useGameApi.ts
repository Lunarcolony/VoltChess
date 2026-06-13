import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";
import {
  deleteServerGame,
  fetchGames,
  fetchGame,
  type ServerGame,
} from "@/lib/api/games";

export function useServerGames(studentId?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["server-games", studentId ?? "me"],
    queryFn: () => fetchGames(studentId),
    enabled: ENABLE_AUTHENTICATION && isAuthenticated,
  });
}

export function useServerGame(gameId?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["server-game", gameId],
    queryFn: () => fetchGame(gameId!),
    enabled: ENABLE_AUTHENTICATION && isAuthenticated && !!gameId,
  });
}

export function useInvalidateServerGames() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["server-games"] });
}

export async function removeServerGame(gameId: string) {
  await deleteServerGame(gameId);
}

export type { ServerGame };
