import { isWasmSupported } from "@/lib/engine/shared";
import {
  ensureSharedEngine,
  getSharedEngine,
  getSharedEngineName,
  subscribeSharedEngine,
} from "@/lib/engine/sharedEngine";
import { UciEngine } from "@/lib/engine/uciEngine";
import { EngineName } from "@/types/enums";
import { useEffect, useState } from "react";

/** Single shared Stockfish instance for the whole app (analysis, play, etc.). */
export const useEngine = (engineName: EngineName | undefined) => {
  const [engine, setEngine] = useState<UciEngine | null>(() => {
    if (!engineName) return null;
    return getSharedEngineName() === engineName ? getSharedEngine() : null;
  });

  useEffect(() => {
    if (!engineName) {
      setEngine(null);
      return;
    }

    if (engineName !== EngineName.Stockfish11 && !isWasmSupported()) {
      setEngine(null);
      return;
    }

    return subscribeSharedEngine((shared) => {
      setEngine(getSharedEngineName() === engineName ? shared : null);
    });
  }, [engineName]);

  useEffect(() => {
    if (!engineName) return;
    if (engineName !== EngineName.Stockfish11 && !isWasmSupported()) return;
    void ensureSharedEngine(engineName).catch(() => undefined);
  }, [engineName]);

  return engine;
};
