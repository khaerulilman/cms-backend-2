import * as Sentry from "@sentry/node";
import { config } from "./env.js";
import logger from "../utils/logger.js";

/**
 * Initialize Sentry error tracking.
 * Only enabled when SENTRY_DSN is provided and not in test environment.
 */
export function initSentry(app) {
  if (!config.SENTRY_DSN) {
    logger.warn("SENTRY_DSN not set — Sentry error tracking is disabled");
    return;
  }

  if (config.NODE_ENV === "test") {
    logger.info("Sentry disabled in test environment");
    return;
  }

  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    // Adjust sample rates based on environment
    tracesSampleRate: config.NODE_ENV === "production" ? 0.2 : 1.0,
    // Only send errors in production/staging; capture all in dev
    beforeSend(event) {
      // Optionally filter out certain errors
      return event;
    },
    integrations: [
      // Express integration for automatic request data
      Sentry.expressIntegration(),
    ],
  });

  // Sentry request handler — must be added before all route handlers
  Sentry.setupExpressErrorHandler(app);

  logger.info(
    { environment: config.NODE_ENV },
    "Sentry error tracking initialized",
  );
}

/**
 * Manually capture an exception in Sentry with optional context.
 */
export function captureError(error, context = {}) {
  if (!config.SENTRY_DSN || config.NODE_ENV === "test") return;

  Sentry.withScope((scope) => {
    if (context.user) {
      scope.setUser(context.user);
    }
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

export default { initSentry, captureError };
