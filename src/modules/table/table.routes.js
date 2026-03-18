import { Router } from 'express';

import { authMiddleware } from '../../middlewares/auth.middleware.js';

import TableController from './table.controller.js';

const router = Router();
const controller = new TableController();

// All routes require authentication
router.use(authMiddleware);

// Create table
router.post('/', (req, res, next) => controller.createTable(req, res, next));

// Get all tables by project
router.get('/project/:projectId', (req, res, next) =>
  controller.getTablesByProject(req, res, next),
);

// Get specific table
router.get('/:tableId', (req, res, next) =>
  controller.getTableById(req, res, next),
);

// Update table
router.put('/:tableId', (req, res, next) =>
  controller.updateTable(req, res, next),
);

// Delete table
router.delete('/:tableId', (req, res, next) =>
  controller.deleteTable(req, res, next),
);

// Duplicate table (deep copy with columns, rows, and cells)
router.post('/:tableId/duplicate', (req, res, next) =>
  controller.duplicateTable(req, res, next),
);

// Get table simplified (with resolved table references)
router.get('/:tableId/simplified', (req, res, next) =>
  controller.getTableSimplified(req, res, next),
);

export default router;
