import Joi from 'joi';

import { ERROR_MESSAGES } from '../../constants/http.js';

export const authValidationSchemas = {
  // Register validation schema
  register: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      'string.empty': ERROR_MESSAGES.EMAIL_REQUIRED,
      'string.email': ERROR_MESSAGES.EMAIL_INVALID,
      'any.required': ERROR_MESSAGES.EMAIL_REQUIRED,
    }),
    password: Joi.string()
      .min(8)
      .required()
      .messages({
        'string.empty': ERROR_MESSAGES.PASSWORD_REQUIRED,
        'string.min': ERROR_MESSAGES.PASSWORD_WEAK,
        'any.required': ERROR_MESSAGES.PASSWORD_REQUIRED,
      }),
    name: Joi.string().min(2).max(100).trim().required().messages({
      'string.empty': ERROR_MESSAGES.NAME_REQUIRED,
      'string.min': ERROR_MESSAGES.NAME_TOO_SHORT,
      'string.max': ERROR_MESSAGES.NAME_TOO_LONG,
      'any.required': ERROR_MESSAGES.NAME_REQUIRED,
    }),
  }),

  // Login validation schema
  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
      'string.empty': ERROR_MESSAGES.EMAIL_REQUIRED,
      'string.email': ERROR_MESSAGES.EMAIL_INVALID,
      'any.required': ERROR_MESSAGES.EMAIL_REQUIRED,
    }),
    password: Joi.string().required().messages({
      'string.empty': ERROR_MESSAGES.PASSWORD_REQUIRED,
      'any.required': ERROR_MESSAGES.PASSWORD_REQUIRED,
    }),
  }),

  // Refresh token validation schema
  refreshToken: Joi.object({
    refreshToken: Joi.string().trim().required().messages({
      'string.empty': ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
      'any.required': ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
    }),
  }),
};

export default authValidationSchemas;
