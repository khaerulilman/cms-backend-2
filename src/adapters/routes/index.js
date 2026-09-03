import { Router } from 'express';

import { apiKeyMiddleware } from '../middleware/apiKey.middleware.js';
import { createAuthRoutes } from './auth.routes.js';
import { createApiKeyRoutes } from './apikey.routes.js';
import { createProjectRoutes } from './project.routes.js';
import { createTableRoutes } from './table.routes.js';
import { createColumnRoutes } from './column.routes.js';
import { createRowRoutes } from './row.routes.js';
import { createCellRoutes } from './cell.routes.js';
import { createDiagnosticRoutes } from './diagnostic.routes.js';

export const createApiRoutes = (controllers) => {
  const router = Router();
  const v1 = '/api/v1';

  // Auth routes
  router.use(`${v1}/auth`, createAuthRoutes(controllers.authController));

  // API Key routes
  router.use(`${v1}/apikey`, createApiKeyRoutes(controllers.apiKeyController));

  // Project routes
  router.use(`${v1}/projects`, createProjectRoutes(controllers.projectController));

  // Table routes
  router.use(`${v1}/tables`, createTableRoutes(controllers.tableController));

  // Column routes
  router.use(`${v1}/cms-columns`, createColumnRoutes(controllers.columnController));

  // Row routes
  router.use(`${v1}/cms-rows`, createRowRoutes(controllers.rowController));

  // Cell routes
  router.use(`${v1}/cms-cells`, createCellRoutes(controllers.cellController));

  // Diagnostic / Test routes (for monitoring and error tracking testing)
  router.use(`${v1}/test`, createDiagnosticRoutes(controllers.diagnosticController));

  // API Key protected routes
  // Get table by ID with API Key
  router.get(
    `${v1}/project/:projectId/table/:tableId`,
    apiKeyMiddleware,
    (req, res, next) => controllers.tableController.getTableById(req, res, next),
  );

  // Get simplified table by ID with API Key (allows all origins for public implementation)
  router.get(
    `${v1}/project/:projectId/table/:tableId/simplify`,
    apiKeyMiddleware,
    (req, res, next) => controllers.tableController.getTableSimplified(req, res, next),
  );

  return router;
};

export default createApiRoutes;
