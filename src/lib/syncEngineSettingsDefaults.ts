import {
  ENGINE_DEFAULTS,
  ENGINE_SETTINGS_VERSION,
  ENGINE_SETTINGS_VERSION_KEY,
} from "@/constants/engineDefaults";

/** Apply minimum engine defaults for all users (once per settings version). */
export function syncEngineSettingsDefaults() {
  if (typeof window === "undefined") return;

  try {
    if (
      localStorage.getItem(ENGINE_SETTINGS_VERSION_KEY) ===
      String(ENGINE_SETTINGS_VERSION)
    ) {
      return;
    }

    localStorage.setItem("engine-name", JSON.stringify(ENGINE_DEFAULTS.engine));
    localStorage.setItem("engine-depth", JSON.stringify(ENGINE_DEFAULTS.depth));
    localStorage.setItem(
      "engine-multi-pv",
      JSON.stringify(ENGINE_DEFAULTS.multiPv)
    );
    localStorage.setItem(
      "engineWorkersNb",
      JSON.stringify(ENGINE_DEFAULTS.workers)
    );
    localStorage.setItem("boardHue", JSON.stringify(ENGINE_DEFAULTS.boardHue));
    localStorage.setItem(
      ENGINE_SETTINGS_VERSION_KEY,
      String(ENGINE_SETTINGS_VERSION)
    );
  } catch {
    // ignore private browsing / quota errors
  }
}
