import { Router } from "express";

import { apiKeyMiddleware } from "./middlewares/apiKey.middleware.js";
import apiKeyRoutes from "./modules/apikey/apikey.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import cellRoutes from "./modules/cells/cell.routes.js";
import columnRoutes from "./modules/columns/column.routes.js";
import projectRoutes from "./modules/project/project.routes.js";
import rowRoutes from "./modules/rows/row.routes.js";
import TableController from "./modules/table/table.controller.js";
import tableRoutes from "./modules/table/table.routes.js";
import testRoutes from "./tests/sentryTest/test.routes.js";

const router = Router();
const tableController = new TableController();

const v1 = "/api/v1";

// Auth routes
router.use(`${v1}/auth`, authRoutes);

// API Key routes
router.use(`${v1}/apikey`, apiKeyRoutes);

// Project routes
router.use(`${v1}/projects`, projectRoutes);

// table routes
router.use(`${v1}/tables`, tableRoutes);

// column routes
router.use(`${v1}/cms-columns`, columnRoutes);

// row routes
router.use(`${v1}/cms-rows`, rowRoutes);

// cell routes
router.use(`${v1}/cms-cells`, cellRoutes);

// Test routes (for monitoring and error tracking testing)
router.use(`${v1}/test`, testRoutes);

// API Key protected routes
// Get table by ID with API Key
router.get(
  `${v1}/project/:projectId/table/:tableId`,
  apiKeyMiddleware,
  (req, res, next) => tableController.getTableById(req, res, next),
);

// Get simplified table by ID with API Key (allows all origins for public implementation)
router.get(
  `${v1}/project/:projectId/table/:tableId/simplify`,
  apiKeyMiddleware,
  (req, res, next) => tableController.getTableSimplified(req, res, next),
);

export default router;
