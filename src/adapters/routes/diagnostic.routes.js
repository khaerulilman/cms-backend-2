import { Router } from 'express';

export const createDiagnosticRoutes = (diagnosticController) => {
  const router = Router();

  // Health check
  router.get('/health', (req, res) => diagnosticController.testHealth(req, res));

  // Error trigger for testing Sentry
  router.get('/error', (req, res, next) => diagnosticController.triggerError(req, res, next));

  return router;
};

export default createDiagnosticRoutes;
