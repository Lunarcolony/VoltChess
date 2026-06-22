import type { LoadedGame } from "@/types/game";

const LABELS: Record<string, string> = {
  ultrabullet: "UltraBullet",
  "ultra bullet": "UltraBullet",
  bullet: "Bullet",
  blitz: "Blitz",
  rapid: "Rapid",
  classical: "Classical",
  daily: "Daily",
  correspondence: "Correspondence",
};

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatTimeClassLabel(raw?: string): string | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toLowerCase().replace(/_/g, " ");
  return LABELS[key] ?? capitalize(raw.trim());
}

/** Derive category from base time in seconds (FIDE-ish / Chess.com-ish cutoffs). */
export function timeClassFromBaseSeconds(seconds: number): string {
  if (seconds < 30) return "UltraBullet";
  if (seconds < 180) return "Bullet";
  if (seconds < 600) return "Blitz";
  if (seconds < 3600) return "Rapid";
  return "Classical";
}

function parseBaseSeconds(timeControl?: string): number | null {
  if (!timeControl?.trim()) return null;

  const raw = timeControl.trim().toLowerCase();

  const clockMatch = raw.match(/^(\d+)\+(\d+)$/);
  if (clockMatch) {
    const minutes = Number(clockMatch[1]);
    if (!Number.isNaN(minutes)) return minutes * 60;
  }

  const hms = raw.match(/^(\d+)h(?:(\d+)m)?/);
  if (hms) {
    const hours = Number(hms[1]);
    const mins = hms[2] ? Number(hms[2]) : 0;
    return hours * 3600 + mins * 60;
  }

  const ms = raw.match(/^(\d+)m(?:(\d+)s)?/);
  if (ms) {
    const minutes = Number(ms[1]);
    const secs = ms[2] ? Number(ms[2]) : 0;
    return minutes * 60 + secs;
  }

  const secOnly = raw.match(/^(\d+)s/);
  if (secOnly) return Number(secOnly[1]);

  const plainMinutes = raw.match(/^(\d+)m$/);
  if (plainMinutes) return Number(plainMinutes[1]) * 60;

  return null;
}

export function getTimeClassLabel(game: LoadedGame): string | null {
  const fromApi = formatTimeClassLabel(game.timeClass);
  if (fromApi) return fromApi;

  const baseSeconds = parseBaseSeconds(game.timeControl);
  if (baseSeconds !== null) return timeClassFromBaseSeconds(baseSeconds);

  return null;
}
