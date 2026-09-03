import { HTTP_STATUS, ERROR_MESSAGES } from '../../entities/constants/http.js';
import { captureError } from '../../frameworks/monitoring/sentry.js';
import * as ErrorClasses from '../../entities/errors/index.js';
import logger from '../../frameworks/logging/logger.js';

// Helper function to sanitize error message - removes sensitive information
const sanitizeErrorMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  }

  const sensitivePatterns = [
    /[\w.-]+\.rds\.amazonaws\.com/gi,
    /[\w.-]+\.database\.azure\.com/gi,
    /[\w.-]+\.mongo\.online/gi,
    /mongodb\+srv:\/\/[^\s]+/gi,
    /postgresql:\/\/[^\s]+/gi,
    /mysql:\/\/[^\s]+/gi,
    /postgres:\/\/[^\s]+/gi,
    /arn:aws:[^\s]+/gi,
    /[\w-]+\.[\w-]+\.amazonaws\.com/gi,
    /password=[^\s,}\]]+/gi,
    /api[_-]?key=[^\s,}\]]+/gi,
    /secret=[^\s,}\]]+/gi,
    /token=[^\s,}\]]+/gi,
    /[A-Za-z]:\\[^\\]*/gi,
    /\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[^\\/]*/gi,
    /Invalid `prisma\.[\w.]+\(\)` invocation:/gi,
    /Please make sure to provide valid database credentials/gi,
    /at\s+[\w.\s]+\([^)]+\)/gi,
    /\s{2,}at\s+/gi,
  ];

  let sanitized = message;

  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  const isTechnicalError =
    sanitized.includes('invocation') ||
    sanitized.includes('credentials') ||
    sanitized.includes('connection') ||
    sanitized.includes('database') ||
    sanitized.length > 200;

  if (isTechnicalError && process.env.NODE_ENV !== 'development') {
    return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  }

  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  return sanitized || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
};

export const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  if (err instanceof ErrorClasses.AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = ERROR_MESSAGES.INVALID_TOKEN;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = ERROR_MESSAGES.INVALID_TOKEN;
  } else if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = err.message;
  } else if (err.message) {
    message = sanitizeErrorMessage(err.message);
  }

  if (statusCode >= 500) {
    captureError(err, {
      tags: { statusCode, method: req.method, path: req.originalUrl },
      user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      extra: { body: req.body, query: req.query, params: req.params },
    });
  }

  if (statusCode >= 500) {
    logger.error(
      {
        err,
        path: req.originalUrl,
        method: req.method,
        statusCode,
      },
      'Unhandled server error',
    );
  } else {
    logger.warn(
      {
        message: err.message,
        path: req.originalUrl,
        method: req.method,
        statusCode,
      },
      'Client error',
    );
  }

  const response = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === 'development' && err.details) {
    if (typeof err.details === 'string') {
      response.details = sanitizeErrorMessage(err.details);
    } else if (typeof err.details === 'object' && err.details !== null) {
      response.details = {};
      for (const [key, value] of Object.entries(err.details)) {
        if (typeof value === 'string') {
          response.details[key] = sanitizeErrorMessage(value);
        } else {
          response.details[key] = value;
        }
      }
    } else {
      response.details = err.details;
    }
  }

  return res.status(statusCode).json(response);
};

export default errorMiddleware;
