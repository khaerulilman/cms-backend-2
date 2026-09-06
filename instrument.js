import 'dotenv/config';

import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV || 'development';

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
  });
}
