import * as Sentry from '@sentry/node';

import { config } from '../config/env.js';
import logger from '../logging/logger.js';

export const initSentry = (app) => {
  if (!config.SENTRY_DSN) {
    logger.warn('Sentry DSN not provided, error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: config.SENTRY_DSN,
      environment: config.NODE_ENV,
      tracesSampleRate: config.NODE_ENV === 'production' ? 0.2 : 1.0,
    });

    if (typeof Sentry.setupExpressErrorHandler === 'function') {
      Sentry.setupExpressErrorHandler(app);
    } else if (Sentry.Handlers) {
      app.use(Sentry.Handlers.requestHandler());
      app.use(Sentry.Handlers.tracingHandler());
      app.use(Sentry.Handlers.errorHandler());
    }

    logger.info('Sentry error tracking initialized');
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize Sentry');
  }
};

export const captureError = (error, context = {}) => {
  if (config.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context.tags) scope.setTags(context.tags);
      if (context.user) scope.setUser(context.user);
      if (context.extra) scope.setExtras(context.extra);
      Sentry.captureException(error);
    });
  }
};

export default { initSentry, captureError };
