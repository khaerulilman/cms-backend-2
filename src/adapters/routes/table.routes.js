import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { cacheResponse, invalidateCache } from '../../frameworks/cache/redis.js';
import { tableValidationSchemas } from '../services/validation/table.validation.js';

export const createTableRoutes = (tableController) => {
  const router = Router();

  router.use(authMiddleware);

  // Create table
  router.post(
    '/',
    sanitizeInput,
    validateRequest(tableValidationSchemas.createTable),
    invalidateCache(['tables']),
    (req, res, next) => tableController.createTable(req, res, next),
  );

  // Get all tables by project
  router.get('/project/:projectId', cacheResponse('tables'), (req, res, next) =>
    tableController.getUserTablesByProject(req, res, next),
  );

  // Get specific table
  router.get('/:tableId', cacheResponse('tables'), (req, res, next) =>
    tableController.getTableById(req, res, next),
  );

  // Update table
  router.put(
    '/:tableId',
    sanitizeInput,
    validateRequest(tableValidationSchemas.updateTable),
    invalidateCache(['tables', 'cms-columns', 'cms-rows', 'cms-cells']),
    (req, res, next) => tableController.updateTable(req, res, next),
  );

  // Delete table
  router.delete(
    '/:tableId',
    invalidateCache(['tables', 'cms-columns', 'cms-rows', 'cms-cells']),
    (req, res, next) => tableController.deleteTable(req, res, next),
  );

  // Duplicate table
  router.post(
    '/:tableId/duplicate',
    invalidateCache(['tables', 'cms-columns', 'cms-rows', 'cms-cells']),
    (req, res, next) => tableController.duplicateTable(req, res, next),
  );

  // Get table simplified
  router.get('/:tableId/simplified', cacheResponse('tables'), (req, res, next) =>
    tableController.getTableSimplified(req, res, next),
  );

  return router;
};

export default createTableRoutes;
