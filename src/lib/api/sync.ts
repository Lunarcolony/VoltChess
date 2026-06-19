import api from "@/api";
import type { ServerGameDetail } from "@/lib/api/games";

export type PlatformLinkSync = {
  link_id: string;
  coach_username: string;
  platform: "" | "chesscom" | "lichess";
  platform_username: string;
  sync_enabled: boolean;
  last_sync_at: string | null;
  sync_status: "idle" | "syncing" | "error";
  sync_error: string;
};

export type SyncOverview = {
  platform_links: PlatformLinkSync[];
  games_total: number;
  games_analyzed: number;
  games_pending: number;
  games_in_progress: number;
  games_failed?: number;
  last_sync_at: string | null;
};

export type SyncTriggerResult = {
  link_id?: string;
  fetched?: number;
  created?: number;
  updated?: number;
  pending_analysis?: number;
  last_sync_at?: string;
  error?: string;
  results?: SyncTriggerResult[];
};

export async function fetchSyncOverview(
  studentId?: string
): Promise<SyncOverview> {
  const res = await api.get<SyncOverview>("/api/sync/overview/", {
    params: studentId ? { student_id: studentId } : undefined,
  });
  return res.data;
}

export async function triggerSync(payload?: {
  link_id?: string;
  student_id?: string;
}): Promise<SyncTriggerResult> {
  const res = await api.post<SyncTriggerResult>(
    "/api/sync/trigger/",
    payload ?? {}
  );
  return res.data;
}

export async function sendSyncPresence(browserBusy: boolean): Promise<void> {
  await api.post("/api/sync/presence/", { browser_busy: browserBusy });
}

export async function fetchPendingAnalysis(
  limit = 3
): Promise<ServerGameDetail[]> {
  const res = await api.get<ServerGameDetail[]>("/api/sync/pending-analysis/", {
    params: { limit },
  });
  return res.data;
}

export async function claimGameAnalysis(
  gameId: string
): Promise<ServerGameDetail> {
  const res = await api.post<ServerGameDetail>(
    `/api/sync/games/${gameId}/claim/`
  );
  return res.data;
}

export async function completeGameAnalysis(
  gameId: string,
  evalPayload: {
    positions: unknown[];
    accuracy: { white: number; black: number };
    estimated_elo?: { white: number; black: number } | null;
    settings: Record<string, unknown>;
  }
): Promise<void> {
  await api.post(`/api/sync/games/${gameId}/complete/`, evalPayload);
}

export async function processServerAnalysisQueue(maxGames = 3): Promise<{
  processed: number;
  failed?: number;
  attempted?: number;
  reason?: string;
}> {
  const res = await api.post("/api/sync/process-server/", {
    max_games: maxGames,
  });
  return res.data;
}
