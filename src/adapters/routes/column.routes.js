import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { cacheResponse, invalidateCache } from '../../frameworks/cache/redis.js';
import { columnValidationSchemas } from '../services/validation/column.validation.js';

export const createColumnRoutes = (columnController) => {
  const router = Router();

  router.use(authMiddleware);

  // Create columns
  router.post(
    '/',
    sanitizeInput,
    validateRequest(columnValidationSchemas.createColumns),
    invalidateCache(['cms-columns', 'tables']),
    (req, res, next) => columnController.createColumns(req, res, next),
  );

  // Get all columns by table
  router.get('/table/:tableId', cacheResponse('cms-columns'), (req, res, next) =>
    columnController.getColumnsByTable(req, res, next),
  );

  // Get specific column
  router.get('/:columnId', cacheResponse('cms-columns'), (req, res, next) =>
    columnController.getColumnById(req, res, next),
  );

  // Update column
  router.put(
    '/:columnId',
    sanitizeInput,
    validateRequest(columnValidationSchemas.updateColumn),
    invalidateCache(['cms-columns', 'tables', 'cms-cells']),
    (req, res, next) => columnController.updateColumn(req, res, next),
  );

  // Delete column
  router.delete(
    '/:columnId',
    invalidateCache(['cms-columns', 'tables', 'cms-cells']),
    (req, res, next) => columnController.deleteColumn(req, res, next),
  );

  return router;
};

export default createColumnRoutes;
