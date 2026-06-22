import { EngineName } from "@/types/enums";
import { UciEngine } from "./uciEngine";
import { isWasmSupported } from "./shared";
import { Stockfish11 } from "./stockfish11";
import { Stockfish16 } from "./stockfish16";
import { Stockfish16_1 } from "./stockfish16_1";
import { Stockfish17 } from "./stockfish17";

type EngineListener = (engine: UciEngine | null) => void;

let currentEngine: UciEngine | null = null;
let currentEngineName: EngineName | null = null;
let loadPromise: Promise<UciEngine> | null = null;
let loadPromiseName: EngineName | null = null;
const listeners = new Set<EngineListener>();

function notify() {
  const snap = currentEngine;
  listeners.forEach((fn) => fn(snap));
}

function createEngine(engineName: EngineName): Promise<UciEngine> {
  switch (engineName) {
    case EngineName.Stockfish17:
      return Stockfish17.create(false);
    case EngineName.Stockfish17Lite:
      return Stockfish17.create(true);
    case EngineName.Stockfish16_1:
      return Stockfish16_1.create(false);
    case EngineName.Stockfish16_1Lite:
      return Stockfish16_1.create(true);
    case EngineName.Stockfish16:
      return Stockfish16.create(false);
    case EngineName.Stockfish16NNUE:
      return Stockfish16.create(true);
    case EngineName.Stockfish11:
      return Stockfish11.create();
  }
}

/** Returns the shared engine instance, creating or reusing as needed. */
export async function ensureSharedEngine(
  engineName: EngineName
): Promise<UciEngine> {
  if (currentEngine && currentEngineName === engineName) {
    return currentEngine;
  }

  if (loadPromise && loadPromiseName === engineName) {
    return loadPromise;
  }

  if (currentEngine && currentEngineName !== engineName) {
    currentEngine.shutdown();
    currentEngine = null;
    currentEngineName = null;
    notify();
  }

  loadPromiseName = engineName;
  loadPromise = createEngine(engineName)
    .then((engine) => {
      currentEngine = engine;
      currentEngineName = engineName;
      loadPromise = null;
      notify();
      return engine;
    })
    .catch((err) => {
      loadPromise = null;
      loadPromiseName = null;
      throw err;
    });

  return loadPromise;
}

export function getSharedEngine(): UciEngine | null {
  return currentEngine;
}

export function getSharedEngineName(): EngineName | null {
  return currentEngineName;
}

export function preloadEngine(engineName: EngineName): void {
  if (engineName !== EngineName.Stockfish11 && !isWasmSupported()) return;
  void ensureSharedEngine(engineName).catch(() => undefined);
}

export function subscribeSharedEngine(listener: EngineListener): () => void {
  listeners.add(listener);
  listener(currentEngine);
  return () => listeners.delete(listener);
}
