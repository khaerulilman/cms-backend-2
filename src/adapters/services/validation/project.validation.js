import Joi from 'joi';

export const projectValidationSchemas = {
  // Create project validation schema
  create: Joi.object({
    name: Joi.string().min(1).max(100).trim().required().messages({
      'string.empty': 'Project name is required',
      'string.max': 'Project name must not exceed 100 characters',
      'any.required': 'Project name is required',
    }),
    description: Joi.string().max(500).trim().allow(null, '').messages({
      'string.max': 'Project description must not exceed 500 characters',
    }),
  }),

  // Update project validation schema
  update: Joi.object({
    name: Joi.string().min(1).max(100).trim().messages({
      'string.empty': 'Project name cannot be empty',
      'string.max': 'Project name must not exceed 100 characters',
    }),
    description: Joi.string().max(500).trim().allow(null, '').messages({
      'string.max': 'Project description must not exceed 500 characters',
    }),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field (name or description) must be provided',
    }),
};

export default projectValidationSchemas;
