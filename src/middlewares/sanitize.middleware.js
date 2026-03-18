import xss from 'xss';

import logger from '../utils/logger.js';

/**
 * Recursively sanitize object properties
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
  const sanitized = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        // Sanitize string values
        sanitized[key] = xss(value);
      } else if (Array.isArray(value)) {
        // Sanitize array elements
        sanitized[key] = value.map((item) =>
          typeof item === 'string'
            ? xss(item)
            : typeof item === 'object'
              ? sanitizeObject(item)
              : item,
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeObject(value);
      } else {
        // Keep other types as is
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  logger.debug(
    { method: req.method, path: req.originalUrl },
    'Input sanitized',
  );
  next();
};

export default sanitizeInput;
