import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: isProduction ? 'info' : 'debug',

  // Production: structured JSON logs (machine-readable, for log aggregators)
  // Development: pretty-printed, colorized, human-readable logs
  transport: !isProduction
    ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    }
    : undefined,

  // Production: add extra context for observability
  ...(isProduction && {
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
});

export default logger;
