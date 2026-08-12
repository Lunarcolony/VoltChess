import { ensureSharedEngine, getSharedEngine } from "@/lib/engine/sharedEngine";
import type { UciEngine } from "@/lib/engine/uciEngine";
import { EngineName } from "@/types/enums";
import { sleep } from "@/lib/helpers";

/**
 * Wait until the shared Stockfish instance exists and reports ready.
 * Retries briefly so tool pages don't fail on first click during WASM boot.
 */
export async function waitForEngineReady(
  engineName: EngineName,
  options: { timeoutMs?: number; pollMs?: number } = {}
): Promise<UciEngine> {
  const timeoutMs = options.timeoutMs ?? 20000;
  const pollMs = options.pollMs ?? 100;
  const deadline = Date.now() + timeoutMs;

  const engine = await ensureSharedEngine(engineName);

  while (Date.now() < deadline) {
    const shared = getSharedEngine();
    if (shared && shared.getIsReady()) return shared;
    if (engine.getIsReady()) return engine;
    await sleep(pollMs);
  }

  throw new Error("Engine timed out while loading");
}
