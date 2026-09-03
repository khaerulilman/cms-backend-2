import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { validateParams } from '../middleware/validation.middleware.js';
import { apiKeyValidationSchemas } from '../services/validation/apikey.validation.js';

export const createApiKeyRoutes = (apiKeyController) => {
  const router = Router();

  router.post('/', authMiddleware, sanitizeInput, (req, res, next) =>
    apiKeyController.generateApiKey(req, res, next),
  );

  router.get('/', authMiddleware, sanitizeInput, (req, res, next) =>
    apiKeyController.getApiKeys(req, res, next),
  );

  router.delete(
    '/:apiKeyId',
    authMiddleware,
    sanitizeInput,
    validateParams(apiKeyValidationSchemas.deleteApiKey),
    (req, res, next) => apiKeyController.deleteApiKey(req, res, next),
  );

  return router;
};

export default createApiKeyRoutes;
