import { Router } from 'express';
import Joi from 'joi';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { validateRequest, validateParams } from '../middleware/validation.middleware.js';
import { cacheResponse, invalidateCache } from '../../frameworks/cache/redis.js';
import { projectValidationSchemas } from '../services/validation/project.validation.js';

const projectIdParamSchema = Joi.object({
  projectId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid project ID format',
    'any.required': 'Project ID is required',
  }),
});

export const createProjectRoutes = (projectController) => {
  const router = Router();

  router.use(authMiddleware);

  // Create project
  router.post(
    '/',
    sanitizeInput,
    validateRequest(projectValidationSchemas.create),
    invalidateCache(['projects']),
    (req, res, next) => projectController.createProject(req, res, next),
  );

  // Get all user projects
  router.get('/', cacheResponse('projects'), (req, res, next) =>
    projectController.getUserProjects(req, res, next),
  );

  // Get specific project
  router.get(
    '/:projectId',
    validateParams(projectIdParamSchema),
    cacheResponse('projects'),
    (req, res, next) => projectController.getProject(req, res, next),
  );

  // Update project
  router.put(
    '/:projectId',
    sanitizeInput,
    validateParams(projectIdParamSchema),
    validateRequest(projectValidationSchemas.update),
    invalidateCache(['projects']),
    (req, res, next) => projectController.updateProject(req, res, next),
  );

  // Delete project
  router.delete(
    '/:projectId',
    validateParams(projectIdParamSchema),
    invalidateCache(['projects', 'tables', 'cms-columns', 'cms-rows', 'cms-cells']),
    (req, res, next) => projectController.deleteProject(req, res, next),
  );

  return router;
};

export default createProjectRoutes;
