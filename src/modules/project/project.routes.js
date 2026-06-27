import { Router } from 'express';

import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../../utils/redis.js';

import ProjectController from './project.controller.js';
import {
  validateCreateProject,
  validateUpdateProject,
  validateProjectId,
} from './project.validation.js';

const router = Router();
const controller = new ProjectController();

// All routes require authentication
router.use(authMiddleware);

// Create project
router.post('/', validateCreateProject, invalidateCache(['projects']), (
  req,
  res,
  next,
) => controller.createProject(req, res, next),
);

// Get all user projects
router.get('/', cacheResponse('projects'), (req, res, next) =>
  controller.getUserProjects(req, res, next),
);

// Get specific project
router.get('/:projectId', validateProjectId, cacheResponse('projects'), (
  req,
  res,
  next,
) => controller.getProject(req, res, next),
);

// Update project
router.put(
  '/:projectId',
  validateProjectId,
  validateUpdateProject,
  invalidateCache(['projects']),
  (req, res, next) => controller.updateProject(req, res, next),
);

// Delete project
router.delete(
  '/:projectId',
  validateProjectId,
  invalidateCache(['projects', 'tables', 'cms-columns', 'cms-rows', 'cms-cells']),
  (req, res, next) => controller.deleteProject(req, res, next),
);

export default router;
