/** Shared labels for synced game analysis state (UI only). */

export type AnalysisStatusValue =
  | "pending"
  | "in_progress"
  | "complete"
  | "failed"
  | undefined;

export type GameAnalysisFields = {
  has_eval: boolean;
  analysis_status?: AnalysisStatusValue;
};

export function gameAnalysisLabel(game: GameAnalysisFields): string {
  if (game.has_eval) return "Report ready";
  if (game.analysis_status === "failed") return "Retry queued";
  if (game.analysis_status === "in_progress") return "Analyzing";
  return "Not analyzed";
}

export function gameAnalysisChipColor(
  game: GameAnalysisFields
): "success" | "warning" | "error" | "default" {
  if (game.has_eval) return "success";
  if (game.analysis_status === "failed") return "error";
  if (game.analysis_status === "in_progress") return "warning";
  return "default";
}
