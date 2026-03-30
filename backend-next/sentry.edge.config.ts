import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://97f98a40eef61c33c923f3157951da06@o4510470474825728.ingest.de.sentry.io/4510483748094032',

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
