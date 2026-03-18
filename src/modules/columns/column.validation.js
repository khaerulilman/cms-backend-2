import Joi from 'joi';

import { ERROR_MESSAGES } from '../../constants/http.js';

export const columnValidationSchemas = {
  // Create columns validation schema
  createColumns: Joi.object({
    tableId: Joi.string().uuid().required().messages({
      'string.empty': ERROR_MESSAGES.TABLE_ID_REQUIRED,
      'string.guid': ERROR_MESSAGES.INVALID_TABLE_ID,
      'any.required': ERROR_MESSAGES.TABLE_ID_REQUIRED,
    }),
    columns: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(1).max(255).trim().required().messages({
            'string.empty': ERROR_MESSAGES.COLUMN_NAME_REQUIRED,
            'string.min': ERROR_MESSAGES.COLUMN_NAME_EMPTY,
            'string.max': ERROR_MESSAGES.COLUMN_NAME_TOO_LONG,
            'any.required': ERROR_MESSAGES.COLUMN_NAME_REQUIRED,
          }),
        }),
      )
      .min(1)
      .required()
      .messages({
        'array.base': ERROR_MESSAGES.COLUMNS_REQUIRED,
        'array.min': ERROR_MESSAGES.COLUMNS_EMPTY,
        'any.required': ERROR_MESSAGES.COLUMNS_REQUIRED,
      }),
  }),

  // Update column validation schema
  updateColumn: Joi.object({
    name: Joi.string().min(1).max(255).trim().required().messages({
      'string.empty': ERROR_MESSAGES.COLUMN_NAME_EMPTY,
      'string.min': ERROR_MESSAGES.COLUMN_NAME_EMPTY,
      'string.max': ERROR_MESSAGES.COLUMN_NAME_TOO_LONG,
      'any.required': ERROR_MESSAGES.COLUMN_NAME_REQUIRED,
    }),
  }),
};

export default columnValidationSchemas;
