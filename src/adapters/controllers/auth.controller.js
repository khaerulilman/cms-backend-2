import { config } from '../../frameworks/config/env.js';
import {
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  ERROR_MESSAGES,
} from '../../entities/constants/http.js';
import logger from '../../frameworks/logging/logger.js';

// Detect if frontend and backend are on different sites (cross-site)
const isCrossSite =
  config.COOKIE_CROSS_SITE === 'true' || config.COOKIE_CROSS_SITE === true;

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isCrossSite || config.NODE_ENV === 'production',
  sameSite: isCrossSite
    ? 'none'
    : config.NODE_ENV === 'production'
      ? 'strict'
      : 'lax',
  maxAge,
  path: '/',
});

const getClearCookieOptions = () => {
  const { maxAge: _maxAge, ...options } = getCookieOptions(0);
  return options;
};

export class AuthController {

  constructor({ authUseCase, jwtService }) {
    this.useCase = authUseCase;
    this.jwtService = jwtService;
  }

  _getClientMetadata(req) {
    return {
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
    };
  }

  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;
      logger.debug({ email }, 'Register request received');
      const result = await this.useCase.register(email, password, name, this._getClientMetadata(req));

      res.cookie('accessToken', result.accessToken, getCookieOptions(15 * 60 * 1000));
      res.cookie('refreshToken', result.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

      logger.info({ userId: result.user.id, email }, 'User registered successfully');
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.USER_REGISTERED,
        data: { user: result.user },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      logger.debug({ email }, 'Login request received');
      const result = await this.useCase.login(email, password, this._getClientMetadata(req));

      res.cookie('accessToken', result.accessToken, getCookieOptions(15 * 60 * 1000));
      res.cookie('refreshToken', result.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

      logger.info({ userId: result.user.id, email }, 'User logged in successfully');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        data: { user: result.user },
      });
    } catch (error) {
      next(error);
    }
  }

  async googleOAuthCallback(req, res, next) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      const accessToken = this.jwtService.generateAccessToken(user.id, user.email);
      const refreshToken = this.jwtService.generateRefreshToken(user.id, user.email);

      await this.useCase._storeRefreshToken(user.id, refreshToken, this._getClientMetadata(req));

      res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));
      res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

      const setupToken = this.jwtService.generateSetupToken(user.id, user.email);

      const userData = Buffer.from(
        JSON.stringify({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }),
      ).toString('base64');

      const frontendUrl = new URL(`${config.FRONTEND_URL}/login`);
      frontendUrl.searchParams.append('user', userData);
      frontendUrl.searchParams.append('oauth', 'success');
      frontendUrl.searchParams.append('setup_token', setupToken);

      logger.info({ userId: user.id, email: user.email }, 'Google OAuth callback processed successfully');
      return res.redirect(frontendUrl.toString());
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const refreshTokenValue = req.cookies?.refreshToken || req.body.refreshToken;
      logger.debug({}, 'Token refresh request received');
      const result = await this.useCase.refreshToken(refreshTokenValue, this._getClientMetadata(req));

      res.cookie('accessToken', result.accessToken, getCookieOptions(15 * 60 * 1000));
      res.cookie('refreshToken', result.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

      logger.info({}, 'Token refreshed successfully');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.TOKEN_REFRESHED,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      logger.debug({ hasToken: !!refreshToken }, 'Logout request received');
      if (refreshToken) {
        await this.useCase.logout(refreshToken);
      }

      res.clearCookie('accessToken', getClearCookieOptions());
      res.clearCookie('refreshToken', getClearCookieOptions());

      logger.info({}, 'User logged out successfully');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      logger.debug({ userId }, 'Get profile request received');
      const profile = await this.useCase.getProfile(userId);

      logger.info({ userId }, 'Profile retrieved successfully');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.PROFILE_RETRIEVED,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async logoutAllDevices(req, res, next) {
    try {
      const userId = req.user.id;
      logger.debug({ userId }, 'Logout all devices request received');
      await this.useCase.logoutAllDevices(userId);

      res.clearCookie('accessToken', getClearCookieOptions());
      res.clearCookie('refreshToken', getClearCookieOptions());

      logger.info({ userId }, 'User logged out from all devices');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.LOGOUT_ALL_SUCCESS,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveSessions(req, res, next) {
    try {
      const userId = req.user.id;
      logger.debug({ userId }, 'Get active sessions request received');
      const sessions = await this.useCase.getActiveSessions(userId);

      logger.info({ userId, sessionCount: sessions.length }, 'Active sessions retrieved');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.SESSIONS_RETRIEVED,
        data: { sessions },
      });
    } catch (error) {
      next(error);
    }
  }

  async establishSession(req, res, next) {
    try {
      const { setupToken } = req.body;
      logger.debug({}, 'Establish session request received');
      if (!setupToken) {
        logger.warn({}, 'Establish session called without setup token');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Setup token is required',
        });
      }

      const decoded = this.jwtService.verifyToken(setupToken);
      if (!decoded || decoded.type !== 'setup') {
        logger.warn({}, 'Invalid or expired setup token');
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid or expired setup token',
        });
      }

      const metadata = this._getClientMetadata(req);
      if (metadata.userAgent) {
        const existingTokens = await this.useCase.repository.getUserActiveTokens(decoded.id);
        const tokensToRevoke = existingTokens.filter(
          (token) =>
            token.userAgent === metadata.userAgent &&
            token.ipAddress === metadata.ipAddress,
        );
        for (const token of tokensToRevoke) {
          await this.useCase.repository.revokeRefreshToken(token.token);
        }
      }

      const accessToken = this.jwtService.generateAccessToken(decoded.id, decoded.email);
      const refreshToken = this.jwtService.generateRefreshToken(decoded.id, decoded.email);

      await this.useCase._storeRefreshToken(decoded.id, refreshToken, metadata);

      res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));
      res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

      logger.info({ userId: decoded.id }, 'Session established successfully');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Session established successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
