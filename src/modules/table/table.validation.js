import Joi from "joi";

export const tableValidationSchemas = {
  // Create table validation schema
  createTable: Joi.object({
    projectId: Joi.string().uuid().required().messages({
      "string.empty": "Project ID is required",
      "string.guid": "Project ID must be a valid UUID",
      "any.required": "Project ID is required",
    }),
    name: Joi.string().min(1).max(255).trim().required().messages({
      "string.empty": "Table name is required",
      "string.min": "Table name cannot be empty",
      "string.max": "Table name cannot exceed 255 characters",
      "any.required": "Table name is required",
    }),
    isSubTable: Joi.boolean().optional().messages({
      "boolean.base": "isSubTable must be a boolean",
    }),
  }),

  // Update table validation schema
  updateTable: Joi.object({
    name: Joi.string().min(1).max(255).trim().required().messages({
      "string.empty": "Table name cannot be empty",
      "string.min": "Table name cannot be empty",
      "string.max": "Table name cannot exceed 255 characters",
      "any.required": "Table name is required",
    }),
    isSubTable: Joi.boolean().optional().messages({
      "boolean.base": "isSubTable must be a boolean",
    }),
  }),

  // Duplicate table - validate tableId parameter
  duplicateTable: Joi.object({
    tableId: Joi.string().uuid().required().messages({
      "string.empty": "Table ID is required",
      "string.guid": "Table ID must be a valid UUID",
      "any.required": "Table ID is required",
    }),
  }),
};

export default tableValidationSchemas;
