import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { cacheResponse, invalidateCache } from '../../frameworks/cache/redis.js';
import { rowValidationSchemas } from '../services/validation/row.validation.js';

export const createRowRoutes = (rowController) => {
  const router = Router();

  router.use(authMiddleware);

  // Create row
  router.post(
    '/',
    sanitizeInput,
    validateRequest(rowValidationSchemas.createRow),
    invalidateCache(['cms-rows', 'tables']),
    (req, res, next) => rowController.createRow(req, res, next),
  );

  // Get all rows by table
  router.get(
    '/table/:tableId',
    validateRequest(rowValidationSchemas.getRowsByTable, 'params'),
    cacheResponse('cms-rows'),
    (req, res, next) => rowController.getRowsByTable(req, res, next),
  );

  // Get specific row
  router.get(
    '/:rowId',
    validateRequest(rowValidationSchemas.getRowById, 'params'),
    cacheResponse('cms-rows'),
    (req, res, next) => rowController.getRowById(req, res, next),
  );

  // Update row
  router.put(
    '/:rowId',
    sanitizeInput,
    validateRequest(rowValidationSchemas.updateRow, 'params'),
    invalidateCache(['cms-rows', 'tables', 'cms-cells']),
    (req, res, next) => rowController.updateRow(req, res, next),
  );

  // Bulk delete rows
  router.delete(
    '/bulk',
    sanitizeInput,
    validateRequest(rowValidationSchemas.bulkDeleteRows),
    invalidateCache(['cms-rows', 'tables', 'cms-cells']),
    (req, res, next) => rowController.bulkDeleteRows(req, res, next),
  );

  // Delete row
  router.delete(
    '/:rowId',
    validateRequest(rowValidationSchemas.deleteRow, 'params'),
    invalidateCache(['cms-rows', 'tables', 'cms-cells']),
    (req, res, next) => rowController.deleteRow(req, res, next),
  );

  return router;
};

export default createRowRoutes;
