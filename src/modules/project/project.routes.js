import { Router } from 'express';

import { authMiddleware } from '../../middlewares/auth.middleware.js';

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
router.post('/', validateCreateProject, (req, res, next) =>
  controller.createProject(req, res, next),
);

// Get all user projects
router.get('/', (req, res, next) => controller.getUserProjects(req, res, next));

// Get specific project
router.get('/:projectId', validateProjectId, (req, res, next) =>
  controller.getProject(req, res, next),
);

// Update project
router.put(
  '/:projectId',
  validateProjectId,
  validateUpdateProject,
  (req, res, next) => controller.updateProject(req, res, next),
);

// Delete project
router.delete('/:projectId', validateProjectId, (req, res, next) =>
  controller.deleteProject(req, res, next),
);

export default router;
