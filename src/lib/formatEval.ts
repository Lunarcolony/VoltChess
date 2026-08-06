import type { LineEval } from "@/types/eval";

export function formatEvalScore(line?: LineEval | null): string {
  if (!line) return "—";
  if (typeof line.mate === "number") {
    return line.mate > 0 ? `M${line.mate}` : `-M${Math.abs(line.mate)}`;
  }
  if (typeof line.cp === "number") {
    const pawns = line.cp / 100;
    return `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
  }
  return "—";
}
