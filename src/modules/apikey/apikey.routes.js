import { Router } from 'express';

import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { sanitizeInput } from '../../middlewares/sanitize.middleware.js';
import { validateParams } from '../../middlewares/validation.middleware.js';

import ApiKeyController from './apikey.controller.js';
import { apiKeyValidationSchemas } from './apikey.validation.js';

const router = Router();
const controller = new ApiKeyController();

// All routes require authentication and sanitization
router.post('/', authMiddleware, sanitizeInput, (req, res, next) =>
  controller.generateApiKey(req, res, next),
);

router.get('/', authMiddleware, sanitizeInput, (req, res, next) =>
  controller.getApiKeys(req, res, next),
);

router.delete(
  '/:apiKeyId',
  authMiddleware,
  sanitizeInput,
  validateParams(apiKeyValidationSchemas.deleteApiKey),
  (req, res, next) => controller.deleteApiKey(req, res, next),
);

export default router;
