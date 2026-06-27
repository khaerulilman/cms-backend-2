import app from './app.js';
import { config } from './config/env.js';
import logger from './utils/logger.js';
import { initializeRedis } from './utils/redis.js';

const PORT = config.PORT;

await initializeRedis();

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: config.NODE_ENV }, 'Server started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.fatal(err, 'Unhandled promise rejection');
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.fatal(err, 'Uncaught exception');
  process.exit(1);
});

export default server;
