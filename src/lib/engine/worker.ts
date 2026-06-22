import { EngineWorker } from "@/types/engine";
import { isIosDevice, isMobileDevice } from "./shared";

export const getEngineWorker = (enginePath: string): EngineWorker => {
  // Resolve against the site root, NOT the current route. A relative path like
  // "engines/…/x.js" resolves against the page URL, so on a nested route
  // (e.g. /coach/students) it would request "/coach/engines/…/x.js", which the
  // SPA fallback serves as index.html — the worker then dies with
  // "Unexpected token '<'". An absolute "/engines/…" path always loads the real
  // engine file (and the engine's own .wasm imports resolve correctly).
  const absolutePath = enginePath.startsWith("/")
    ? enginePath
    : `/${enginePath}`;

  if (import.meta.env.DEV) {
    console.log(`Creating worker from ${absolutePath}`);
  }

  const worker = new window.Worker(absolutePath);

  const engineWorker: EngineWorker = {
    isReady: false,
    uci: (command: string) => worker.postMessage(command),
    listen: () => null,
    terminate: () => worker.terminate(),
  };

  worker.onmessage = (event) => {
    engineWorker.listen(event.data);
  };

  return engineWorker;
};

export const sendCommandsToWorker = (
  worker: EngineWorker,
  commands: string[],
  finalMessage: string,
  onNewMessage?: (messages: string[]) => void,
  timeoutMs = 120_000
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const messages: string[] = [];
    let settled = false;

    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.listen = () => null;
      reject(
        new Error(
          `Engine worker timed out waiting for "${finalMessage}" after ${timeoutMs}ms`
        )
      );
    }, timeoutMs);

    worker.listen = (data) => {
      messages.push(data);
      onNewMessage?.(messages);

      if (data.startsWith(finalMessage)) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        resolve(messages);
      }
    };

    for (const command of commands) {
      worker.uci(command);
    }
  });
};

export const getRecommendedWorkersNb = (): number => {
  const maxWorkersNbFromThreads = Math.max(
    1,
    Math.round(navigator.hardwareConcurrency - 4),
    Math.floor((navigator.hardwareConcurrency * 2) / 3)
  );

  const maxWorkersNbFromMemory =
    "deviceMemory" in navigator && typeof navigator.deviceMemory === "number"
      ? Math.max(1, Math.round(navigator.deviceMemory))
      : 4;

  const maxWorkersNbFromDevice = isIosDevice() ? 2 : isMobileDevice() ? 4 : 8;

  return Math.min(
    maxWorkersNbFromThreads,
    maxWorkersNbFromMemory,
    maxWorkersNbFromDevice
  );
};
