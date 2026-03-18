import Joi from "joi";

import { ERROR_MESSAGES } from "../../constants/http.js";

export const rowValidationSchemas = {
  // Create row validation schema
  createRow: Joi.object({
    tableId: Joi.string().uuid().required().messages({
      "string.empty": ERROR_MESSAGES.TABLE_ID_REQUIRED,
      "string.guid": ERROR_MESSAGES.INVALID_TABLE_ID,
      "any.required": ERROR_MESSAGES.TABLE_ID_REQUIRED,
    }),
  }),

  // Get rows by table validation schema (params)
  getRowsByTable: Joi.object({
    tableId: Joi.string().uuid().required().messages({
      "string.empty": ERROR_MESSAGES.TABLE_ID_REQUIRED,
      "string.guid": ERROR_MESSAGES.INVALID_TABLE_ID,
      "any.required": ERROR_MESSAGES.TABLE_ID_REQUIRED,
    }),
  }),

  // Get row by ID validation schema (params)
  getRowById: Joi.object({
    rowId: Joi.string().uuid().required().messages({
      "string.empty": ERROR_MESSAGES.ROW_ID_REQUIRED,
      "string.guid": ERROR_MESSAGES.INVALID_ROW_ID,
      "any.required": ERROR_MESSAGES.ROW_ID_REQUIRED,
    }),
  }),

  // Update row validation schema (params)
  updateRow: Joi.object({
    rowId: Joi.string().uuid().required().messages({
      "string.empty": ERROR_MESSAGES.ROW_ID_REQUIRED,
      "string.guid": ERROR_MESSAGES.INVALID_ROW_ID,
      "any.required": ERROR_MESSAGES.ROW_ID_REQUIRED,
    }),
  }),

  // Delete row validation schema (params)
  deleteRow: Joi.object({
    rowId: Joi.string().uuid().required().messages({
      "string.empty": ERROR_MESSAGES.ROW_ID_REQUIRED,
      "string.guid": ERROR_MESSAGES.INVALID_ROW_ID,
      "any.required": ERROR_MESSAGES.ROW_ID_REQUIRED,
    }),
  }),

  // Bulk delete rows validation schema (body)
  bulkDeleteRows: Joi.object({
    rowIds: Joi.array()
      .items(
        Joi.string().uuid().messages({
          "string.guid": ERROR_MESSAGES.INVALID_ROW_IDS,
        }),
      )
      .min(1)
      .required()
      .messages({
        "array.min": ERROR_MESSAGES.ROW_IDS_EMPTY,
        "any.required": ERROR_MESSAGES.ROW_IDS_REQUIRED,
      }),
  }),
};

export default rowValidationSchemas;
