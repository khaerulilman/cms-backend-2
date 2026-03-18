import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/http.js';

/**
 * Validation middleware factory for request body, params, or both
 * @param {Joi.Schema} schema - Joi schema untuk validasi
 * @param {string|string[]} sources - Source(s) to validate: 'body', 'params', 'query', or array like ['params', 'body']
 * @returns {Function} Express middleware
 */
export const validateRequest = (schema, sources = 'body') => {
  return (req, res, next) => {
    // Normalize sources to array
    const sourcesArray = Array.isArray(sources) ? sources : [sources];

    // Combine data from all specified sources
    const dataToValidate = {};
    sourcesArray.forEach((source) => {
      if (req[source]) {
        Object.assign(dataToValidate, req[source]);
      }
    });

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: messages,
      });
    }

    // Distribute validated values back to their sources
    sourcesArray.forEach((source) => {
      const sourceKeys = Object.keys(req[source] || {});
      const validatedSourceData = {};

      sourceKeys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          validatedSourceData[key] = value[key];
        }
      });

      if (Object.keys(validatedSourceData).length > 0) {
        req[source] = validatedSourceData;
      }
    });

    next();
  };
};

/**
 * Validation middleware factory for request params
 * @param {Joi.Schema} schema - Joi schema untuk validasi
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: messages,
      });
    }

    // Replace req.params with validated value
    req.params = value;
    next();
  };
};

export default validateRequest;
