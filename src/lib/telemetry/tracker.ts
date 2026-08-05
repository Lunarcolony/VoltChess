import { track as vercelTrack } from "@vercel/analytics";
import { bumpAggregate, enqueueEvent } from "./storage";
import { markAnalysisStart, takeAnalysisDurationMs } from "./session";

export function trackTelemetry(
  name: string,
  properties: Record<string, unknown> = {}
): void {
  enqueueEvent(name, properties);
}

export type GameAnalyzedProps = {
  engine?: string;
  depth?: number;
  multiPv?: number;
  workers?: number;
  nbPositions?: number;
  durationMs?: number;
  accuracy?: { white: number; black: number } | null;
  estimatedElo?: { white?: number; black?: number } | null;
  source?: string;
  serverGameId?: string | null;
  localGameId?: number | string | null;
  reanalyze?: boolean;
  [key: string]: unknown;
};

export function recordAnalysisStarted(
  properties: Record<string, unknown> = {}
): void {
  markAnalysisStart();
  if (Object.keys(properties).length > 0) {
    // markAnalysisStart already queued analysis_started; enrich via second event only if needed
    trackTelemetry("analysis_started_detail", properties);
  }
}

export function recordGameAnalyzed(props: GameAnalyzedProps): void {
  const durationMs = props.durationMs ?? takeAnalysisDurationMs();
  const properties: Record<string, unknown> = {
    ...props,
    durationMs,
  };
  bumpAggregate("games_analyzed_total", 1);
  enqueueEvent("game_analyzed", properties);
  try {
    vercelTrack("game_analyzed", {
      engine: String(props.engine ?? ""),
      source: String(props.source ?? ""),
      depth: props.depth ?? 0,
      nbPositions: props.nbPositions ?? 0,
      reanalyze: props.reanalyze ? 1 : 0,
    });
  } catch {
    // Vercel analytics must never break analysis
  }
}

export function recordGameLoaded(
  source: string,
  extra: Record<string, unknown> = {}
): void {
  trackTelemetry("game_loaded", { source, ...extra });
  try {
    vercelTrack("game_loaded", { source });
  } catch {
    // ignore
  }
}

export function recordPlayGame(properties: Record<string, unknown>): void {
  trackTelemetry("play_game", properties);
}

export function recordOnboardingComplete(): void {
  trackTelemetry("onboarding_complete", {});
}

export function recordQueueEvent(
  name: "queue_started" | "queue_game_complete" | "queue_done",
  properties: Record<string, unknown> = {}
): void {
  trackTelemetry(name, properties);
}
