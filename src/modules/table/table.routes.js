import { Router } from 'express';

import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../../utils/redis.js';

import TableController from './table.controller.js';

const router = Router();
const controller = new TableController();

// All routes require authentication
router.use(authMiddleware);

// Create table
router.post(
  '/',
  invalidateCache(['tables']),
  (req, res, next) => controller.createTable(req, res, next),
);

// Get all tables by project
router.get('/project/:projectId', cacheResponse('tables'), (req, res, next) =>
  controller.getTablesByProject(req, res, next),
);

// Get specific table
router.get('/:tableId', cacheResponse('tables'), (req, res, next) =>
  controller.getTableById(req, res, next),
);

// Update table
router.put(
  '/:tableId',
  invalidateCache(['tables', 'cms-columns', 'cms-rows', 'cms-cells']),
  (req, res, next) => controller.updateTable(req, res, next),
);

// Delete table
router.delete(
  '/:tableId',
  invalidateCache(['tables', 'cms-columns', 'cms-rows', 'cms-cells']),
  (req, res, next) => controller.deleteTable(req, res, next),
);

// Duplicate table (deep copy with columns, rows, and cells)
router.post(
  '/:tableId/duplicate',
  invalidateCache(['tables', 'cms-columns', 'cms-rows', 'cms-cells']),
  (req, res, next) => controller.duplicateTable(req, res, next),
);

// Get table simplified (with resolved table references)
router.get('/:tableId/simplified', cacheResponse('tables'), (req, res, next) =>
  controller.getTableSimplified(req, res, next),
);

export default router;
