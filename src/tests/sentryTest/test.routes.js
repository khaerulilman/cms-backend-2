import express from "express";
import { triggerError, testHealth } from "./test.controller.js";

const router = express.Router();

/**
 * Test endpoints for monitoring and error tracking
 * These endpoints should be removed or protected in production
 */

// Health check
router.get("/health", testHealth);

// Error trigger for testing Sentry
// Usage: GET /api/v1/test/error?type=unhandled|validation|unauthorized|database
router.get("/error", triggerError);

export default router;
