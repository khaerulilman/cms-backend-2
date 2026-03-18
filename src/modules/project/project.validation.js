import Joi from 'joi';

import { ValidationError } from '../../utils/errors.js';
import { Validator } from '../../utils/validator.js';

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

// Validation middleware factory
const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const message = error.details
          .map((detail) => detail.message)
          .join(', ');
        throw new ValidationError(message);
      }

      req.body = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Export middleware functions
export const validateCreateProject = createValidationMiddleware(
  projectValidationSchemas.create,
);

export const validateUpdateProject = createValidationMiddleware(
  projectValidationSchemas.update,
);

// Validate project ID in params
export const validateProjectId = (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!projectId || !Validator.isValidUUID(projectId)) {
      throw new ValidationError('Invalid project ID format');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default projectValidationSchemas;
