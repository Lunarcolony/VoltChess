import * as Sentry from "@sentry/react";

export const isSentryEnabled = () =>
  !!import.meta.env.VITE_SENTRY_DSN && Sentry.isInitialized();

export const logErrorToSentry = (
  error: unknown,
  context?: Record<string, unknown>
) => {
  if (isSentryEnabled()) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error(error);
  }
};
