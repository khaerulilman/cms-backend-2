import { HTTP_STATUS, ERROR_MESSAGES } from '../../entities/constants/http.js';

export const validateRequest = (schema, sources = 'body') => {
  return (req, res, next) => {
    const sourcesArray = Array.isArray(sources) ? sources : [sources];

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

    req.params = value;
    next();
  };
};

export default validateRequest;
