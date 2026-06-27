import { Router } from 'express';

import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { sanitizeInput } from '../../middlewares/sanitize.middleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { cacheResponse, invalidateCache } from '../../utils/redis.js';

import RowController from './row.controller.js';
import { rowValidationSchemas } from './row.validation.js';

const router = Router();
const controller = new RowController();

// All routes require authentication
router.use(authMiddleware);

// Create row
router.post(
  '/',
  sanitizeInput,
  validateRequest(rowValidationSchemas.createRow),
  invalidateCache(['cms-rows', 'tables']),
  (req, res, next) => controller.createRow(req, res, next),
);

// Get all rows by table
router.get(
  '/table/:tableId',
  validateRequest(rowValidationSchemas.getRowsByTable, 'params'),
  cacheResponse('cms-rows'),
  (req, res, next) => controller.getRowsByTable(req, res, next),
);

// Get specific row
router.get(
  '/:rowId',
  validateRequest(rowValidationSchemas.getRowById, 'params'),
  cacheResponse('cms-rows'),
  (req, res, next) => controller.getRowById(req, res, next),
);

// Update row
router.put(
  '/:rowId',
  sanitizeInput,
  validateRequest(rowValidationSchemas.updateRow, 'params'),
  invalidateCache(['cms-rows', 'tables', 'cms-cells']),
  (req, res, next) => controller.updateRow(req, res, next),
);

// Bulk delete rows
router.delete(
  '/bulk',
  sanitizeInput,
  validateRequest(rowValidationSchemas.bulkDeleteRows),
  invalidateCache(['cms-rows', 'tables', 'cms-cells']),
  (req, res, next) => controller.bulkDeleteRows(req, res, next),
);

// Delete row
router.delete(
  '/:rowId',
  validateRequest(rowValidationSchemas.deleteRow, 'params'),
  invalidateCache(['cms-rows', 'tables', 'cms-cells']),
  (req, res, next) => controller.deleteRow(req, res, next),
);

export default router;
