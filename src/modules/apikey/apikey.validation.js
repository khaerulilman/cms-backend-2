import Joi from 'joi';

import { ERROR_MESSAGES } from '../../constants/http.js';

export const apiKeyValidationSchemas = {
  // Delete API key validation schema (for params)
  deleteApiKey: Joi.object({
    apiKeyId: Joi.string().uuid().required().messages({
      'string.empty': ERROR_MESSAGES.API_KEY_ID_REQUIRED,
      'string.guid': ERROR_MESSAGES.API_KEY_ID_INVALID,
      'any.required': ERROR_MESSAGES.API_KEY_ID_REQUIRED,
    }),
  }),
};

export default apiKeyValidationSchemas;
