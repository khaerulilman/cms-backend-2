import { PrismaClient } from '@prisma/client';

import logger from '../utils/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

const prisma = new PrismaClient({
  log: isProduction
    ? [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ]
    : [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'query' },
    ],
});

prisma.$on('error', (e) => {
  logger.error({ message: e.message, target: e.target }, 'Prisma error');
});

prisma.$on('warn', (e) => {
  logger.warn({ message: e.message, target: e.target }, 'Prisma warning');
});

if (!isProduction) {
  prisma.$on('query', (e) => {
    logger.debug(
      { query: e.query, params: e.params, duration: `${e.duration}ms` },
      'DB query',
    );
  });
}

export default prisma;
