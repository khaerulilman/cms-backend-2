import Joi from 'joi';

import { ERROR_MESSAGES } from '../../constants/http.js';

export const cellValidationSchemas = {
  // Get cells by row validation
  getCellsByRow: Joi.object({
    rowId: Joi.string().uuid().required().messages({
      'string.empty': ERROR_MESSAGES.ROW_ID_REQUIRED,
      'string.guid': ERROR_MESSAGES.INVALID_ROW_ID,
      'any.required': ERROR_MESSAGES.ROW_ID_REQUIRED,
    }),
  }),

  // Upsert cell validation
  upsertCell: Joi.object({
    rowId: Joi.string().uuid().required().messages({
      'string.empty': ERROR_MESSAGES.ROW_ID_REQUIRED,
      'string.guid': ERROR_MESSAGES.INVALID_ROW_ID,
      'any.required': ERROR_MESSAGES.ROW_ID_REQUIRED,
    }),
    columnId: Joi.string().uuid().required().messages({
      'string.empty': ERROR_MESSAGES.COLUMN_ID_REQUIRED,
      'string.guid': ERROR_MESSAGES.INVALID_COLUMN_ID,
      'any.required': ERROR_MESSAGES.COLUMN_ID_REQUIRED,
    }),
    value: Joi.string().max(5000).allow('', null).optional().messages({
      'string.max': ERROR_MESSAGES.CELL_VALUE_TOO_LONG,
    }),
  }),
};

export default cellValidationSchemas;
