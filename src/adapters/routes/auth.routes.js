import { Router } from 'express';

import { config } from '../../frameworks/config/env.js';
import passport from '../../frameworks/oauth/google-oauth.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { authValidationSchemas } from '../services/validation/auth.validation.js';

export const createAuthRoutes = (authController) => {
  const router = Router();

  // Public routes
  router.post(
    '/register',
    sanitizeInput,
    validateRequest(authValidationSchemas.register),
    (req, res, next) => authController.register(req, res, next),
  );
  router.post(
    '/login',
    sanitizeInput,
    validateRequest(authValidationSchemas.login),
    (req, res, next) => authController.login(req, res, next),
  );
  router.post('/refresh-token', sanitizeInput, (req, res, next) =>
    authController.refreshToken(req, res, next),
  );

  // Logout route
  router.post('/logout', (req, res, next) => authController.logout(req, res, next));

  // Establish session via proxy
  router.post('/establish-session', sanitizeInput, (req, res, next) =>
    authController.establishSession(req, res, next),
  );

  // Google OAuth routes
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }),
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${config.FRONTEND_URL}/login`,
    }),
    (req, res, next) => authController.googleOAuthCallback(req, res, next),
  );

  // Protected routes
  router.get('/profile', authMiddleware, (req, res, next) =>
    authController.getProfile(req, res, next),
  );

  router.post('/logout-all', authMiddleware, (req, res, next) =>
    authController.logoutAllDevices(req, res, next),
  );

  router.get('/sessions', authMiddleware, (req, res, next) =>
    authController.getActiveSessions(req, res, next),
  );

  return router;
};

export default createAuthRoutes;
