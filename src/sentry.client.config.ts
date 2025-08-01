import * as Sentry from "@sentry/react";

if (
  import.meta.env.VITE_SENTRY_DSN &&
  typeof window !== "undefined" &&
  document.location.hostname !== "localhost"
) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        maskAllInputs: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
    initialScope: {
      extra: {
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory:
          "deviceMemory" in navigator &&
          typeof navigator.deviceMemory === "number"
            ? navigator.deviceMemory
            : "unknown",
      },
    },
    ignoreErrors: [
      "AbortError: The user aborted a request.",
      "Failed to fetch",
      "Fetch is aborted",
      "The operation was aborted.",
      "AbortError: AbortError",
      "TypeError: Load failed",
      "RangeError: Out of memory",
      "RuntimeError: Out of bounds memory access (evaluating 'n.apply(null,arguments)')",
      "Uncaught RuntimeError: Aborted(CompileError: WebAssembly.instantiate():",
      "Uncaught RangeError: WebAssembly.Memory(): could not allocate memory",
      "Aborted(NetworkError: Failed to execute 'send' on 'XMLHttpRequest'",
      "Aborted(CompileError: WebAssembly.Module doesn't parse at byte",
      "Aborted(NetworkError:  A network error occurred",
    ],
  });
}
