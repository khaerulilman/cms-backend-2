import logger from '../../frameworks/logging/logger.js';

export default function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    logger.info(
      {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration: `${Date.now() - start}ms`,
      },
      'HTTP request',
    );
  });

  next();
}
