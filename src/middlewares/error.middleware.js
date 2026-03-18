import { HTTP_STATUS, ERROR_MESSAGES } from "../constants/http.js";
import { captureError } from "../config/sentry.js";
import * as ErrorClasses from "../utils/errors.js";
import logger from "../utils/logger.js";

// Helper function to sanitize error message - removes sensitive information
const sanitizeErrorMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  }

  // Patterns to remove from error messages (URLs, credentials, paths, etc.)
  const sensitivePatterns = [
    // Database URLs (RDS, MongoDB, PostgreSQL, MySQL, etc.)
    /[\w.-]+\.rds\.amazonaws\.com/gi,
    /[\w.-]+\.database\.azure\.com/gi,
    /[\w.-]+\.mongo\.online/gi,
    /mongodb\+srv:\/\/[^\s]+/gi,
    /postgresql:\/\/[^\s]+/gi,
    /mysql:\/\/[^\s]+/gi,
    /postgres:\/\/[^\s]+/gi,
    // AWS/Cloud resource identifiers
    /arn:aws:[^\s]+/gi,
    /[\w-]+\.[\w-]+\.amazonaws\.com/gi,
    // Credentials in format key=value
    /password=[^\s,}\]]+/gi,
    /api[_-]?key=[^\s,}\]]+/gi,
    /secret=[^\s,}\]]+/gi,
    /token=[^\s,}\]]+/gi,
    // File paths
    /[A-Za-z]:\\[^\\]*/gi, // Windows paths
    /\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[^\\/]*/gi, // Unix paths
    // Prisma invocation details
    /Invalid `prisma\.[\w.]+\(\)` invocation:/gi,
    /Please make sure to provide valid database credentials/gi,
    // Stack trace patterns
    /at\s+[\w.\s]+\([^)]+\)/gi,
    /\s{2,}at\s+/gi,
  ];

  let sanitized = message;

  // Remove all sensitive patterns
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  // If after sanitization the message is too long or looks like a technical error,
  // use a generic message (especially in production)
  const isTechnicalError =
    sanitized.includes('invocation') ||
    sanitized.includes('credentials') ||
    sanitized.includes('connection') ||
    sanitized.includes('database') ||
    sanitized.length > 200;

  if (isTechnicalError && process.env.NODE_ENV !== 'development') {
    return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  }

  // Clean up multiple spaces and newlines
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
};

export const errorMiddleware = (err, req, res, next) => {
  // Prevent sending response if already sent
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom error classes
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  if (err instanceof ErrorClasses.AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "JsonWebTokenError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = ERROR_MESSAGES.INVALID_TOKEN;
  } else if (err.name === "TokenExpiredError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = ERROR_MESSAGES.INVALID_TOKEN;
  } else if (err.name === "ValidationError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = err.message;
  } else if (err.message) {
    // Sanitize error message to hide sensitive information (URLs, credentials, paths)
    message = sanitizeErrorMessage(err.message);
  }

  // Send 5xx errors to Sentry for tracking
  if (statusCode >= 500) {
    captureError(err, {
      tags: { statusCode, method: req.method, path: req.originalUrl },
      user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      extra: { body: req.body, query: req.query, params: req.params },
    });
  }

  // Log error with context
  if (statusCode >= 500) {
    logger.error(
      {
        err,
        path: req.originalUrl,
        method: req.method,
        statusCode,
      },
      "Unhandled server error",
    );
  } else {
    logger.warn(
      {
        message: err.message,
        path: req.originalUrl,
        method: req.method,
        statusCode,
      },
      "Client error",
    );
  }

  const response = {
    success: false,
    message,
  };

  // Only include stack trace in development mode, but in a cleaner format
  if (process.env.NODE_ENV === "development" && err.details) {
    // Sanitize details to hide sensitive information
    if (typeof err.details === 'string') {
      response.details = sanitizeErrorMessage(err.details);
    } else if (typeof err.details === 'object' && err.details !== null) {
      // If details is an object, sanitize each string value
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
