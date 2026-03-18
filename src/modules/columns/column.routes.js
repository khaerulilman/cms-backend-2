import { Router } from 'express';

import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { sanitizeInput } from '../../middlewares/sanitize.middleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

import ColumnController from './column.controller.js';
import { columnValidationSchemas } from './column.validation.js';

const router = Router();
const controller = new ColumnController();

// All routes require authentication
router.use(authMiddleware);

// Create columns
router.post(
  '/',
  sanitizeInput,
  validateRequest(columnValidationSchemas.createColumns),
  (req, res, next) => controller.createColumns(req, res, next),
);

// Get all columns by table
router.get('/table/:tableId', (req, res, next) =>
  controller.getColumnsByTable(req, res, next),
);

// Get specific column
router.get('/:columnId', (req, res, next) =>
  controller.getColumnById(req, res, next),
);

// Update column
router.put(
  '/:columnId',
  sanitizeInput,
  validateRequest(columnValidationSchemas.updateColumn),
  (req, res, next) => controller.updateColumn(req, res, next),
);

// Delete column
router.delete('/:columnId', (req, res, next) =>
  controller.deleteColumn(req, res, next),
);

export default router;
