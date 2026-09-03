import { HTTP_STATUS, ERROR_MESSAGES } from '../../entities/constants/http.js';
import JwtService from '../services/jwt.service.js';
import logger from '../../frameworks/logging/logger.js';

export const authMiddleware = (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      logger.debug({ path: req.originalUrl }, 'No auth token provided');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.NO_TOKEN_PROVIDED,
      });
    }

    const decoded = JwtService.verifyToken(token);

    if (!decoded || decoded.type !== 'access') {
      logger.warn({ path: req.originalUrl }, 'Invalid or expired auth token');
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    logger.debug(
      { userId: decoded.id, path: req.originalUrl },
      'User authenticated',
    );
    next();
  } catch (error) {
    logger.error(
      { err: error, path: req.originalUrl },
      'Auth middleware error',
    );
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
    });
  }
};

export default authMiddleware;
