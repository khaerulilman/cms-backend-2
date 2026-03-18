import { config } from "../../config/env.js";
import {
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  ERROR_MESSAGES,
} from "../../constants/http.js";
import JwtUtil from "../../utils/jwt.js";
import logger from "../../utils/logger.js";

import AuthService from "./auth.service.js";

// Detect if frontend and backend are on different sites (cross-site)
// Cross-site cookies require SameSite=None and Secure=true
// Controlled via COOKIE_CROSS_SITE env var
const isCrossSite =
  config.COOKIE_CROSS_SITE === "true" || config.COOKIE_CROSS_SITE === true;

// Cookie options for HTTP-only cookies
const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isCrossSite || config.NODE_ENV === "production",
  sameSite: isCrossSite
    ? "none"
    : config.NODE_ENV === "production"
      ? "strict"
      : "lax",
  maxAge,
  path: "/",
});

// clearCookie must use the SAME options (secure, sameSite, path) as setCookie
// otherwise the browser will NOT delete the cookie
const getClearCookieOptions = () => {
  const { maxAge: _maxAge, ...options } = getCookieOptions(0);
  return options;
};

export class AuthController {
  constructor() {
    this.service = new AuthService();
  }

  // Helper method to get client metadata
  getClientMetadata(req) {
    return {
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
    };
  }

  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      logger.debug({ email }, "Register request received");
      const result = await this.service.register(
        email,
        password,
        name,
        this.getClientMetadata(req),
      );

      // Set HTTP-only cookies
      res.cookie(
        "accessToken",
        result.accessToken,
        getCookieOptions(15 * 60 * 1000),
      ); // 15 minutes
      res.cookie(
        "refreshToken",
        result.refreshToken,
        getCookieOptions(7 * 24 * 60 * 60 * 1000),
      ); // 7 days

      logger.info(
        { userId: result.user.id, email },
        "User registered successfully",
      );
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.USER_REGISTERED,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      logger.debug({ email }, "Login request received");
      const result = await this.service.login(
        email,
        password,
        this.getClientMetadata(req),
      );

      // Set HTTP-only cookies
      res.cookie(
        "accessToken",
        result.accessToken,
        getCookieOptions(15 * 60 * 1000),
      ); // 15 minutes
      res.cookie(
        "refreshToken",
        result.refreshToken,
        getCookieOptions(7 * 24 * 60 * 60 * 1000),
      ); // 7 days

      logger.info(
        { userId: result.user.id, email },
        "User logged in successfully",
      );
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req, res, next) {
    try {
      const user = req.user;

      logger.debug({ userId: user?.id }, "Google OAuth callback received");
      if (!user) {
        logger.warn({}, "Google OAuth callback without user data");
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        });
      }

      // Generate tokens
      const accessToken = JwtUtil.generateAccessToken(user.id, user.email);
      const refreshToken = JwtUtil.generateRefreshToken(user.id, user.email);

      // Store refresh token in database
      await this.service.storeRefreshToken(
        user.id,
        refreshToken,
        this.getClientMetadata(req),
      );

      // Set HTTP-only cookies (works when frontend & backend share same domain)
      res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000)); // 15 minutes
      res.cookie(
        "refreshToken",
        refreshToken,
        getCookieOptions(7 * 24 * 60 * 60 * 1000),
      ); // 7 days

      // Generate a short-lived setup token (60s) for cross-origin session establishment
      // Frontend can exchange this via proxy to set cookies on its own domain
      const setupToken = JwtUtil.generateSetupToken(user.id, user.email);

      // Encode user data as base64
      const userData = Buffer.from(
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        }),
      ).toString("base64");

      // Redirect with user data and setup token
      const frontendUrl = new URL(`${config.FRONTEND_URL}/login`);
      frontendUrl.searchParams.append("user", userData);
      frontendUrl.searchParams.append("oauth", "success");
      frontendUrl.searchParams.append("setup_token", setupToken);

      logger.info(
        { userId: user.id, email: user.email },
        "Google OAuth callback processed successfully",
      );
      return res.redirect(frontendUrl.toString());
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      // Try to get refresh token from cookie first, then fallback to body
      const refreshTokenValue =
        req.cookies?.refreshToken || req.body.refreshToken;

      logger.debug({}, "Token refresh request received");
      const result = await this.service.refreshToken(
        refreshTokenValue,
        this.getClientMetadata(req),
      );

      // Set new HTTP-only cookies
      res.cookie(
        "accessToken",
        result.accessToken,
        getCookieOptions(15 * 60 * 1000),
      ); // 15 minutes
      res.cookie(
        "refreshToken",
        result.refreshToken,
        getCookieOptions(7 * 24 * 60 * 60 * 1000),
      ); // 7 days

      logger.info({}, "Token refreshed successfully");
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
      // Get refresh token from cookie
      const refreshToken = req.cookies?.refreshToken;

      logger.debug({ hasToken: !!refreshToken }, "Logout request received");
      // Revoke refresh token in database if exists
      if (refreshToken) {
        await this.service.logout(refreshToken);
      }

      // Clear cookies (must match secure/sameSite/path used when setting) ss
      res.clearCookie("accessToken", getClearCookieOptions());
      res.clearCookie("refreshToken", getClearCookieOptions());

      logger.info({}, "User logged out successfully");
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

      logger.debug({ userId }, "Get profile request received");
      const profile = await this.service.getProfile(userId);

      logger.info({ userId }, "Profile retrieved successfully");
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

      logger.debug({ userId }, "Logout all devices request received");
      await this.service.logoutAllDevices(userId);

      // Clear cookies (must match secure/sameSite/path used when setting)
      res.clearCookie("accessToken", getClearCookieOptions());
      res.clearCookie("refreshToken", getClearCookieOptions());

      logger.info({ userId }, "User logged out from all devices");
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

      logger.debug({ userId }, "Get active sessions request received");
      const sessions = await this.service.getActiveSessions(userId);

      logger.info(
        { userId, sessionCount: sessions.length },
        "Active sessions retrieved",
      );
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.SESSIONS_RETRIEVED,
        data: { sessions },
      });
    } catch (error) {
      next(error);
    }
  }

  // Exchange a short-lived setup token for HTTP-only session cookies
  // Used after OAuth when frontend and backend are on different domains
  // Frontend calls this via Next.js proxy so cookies are set on frontend domain
  async establishSession(req, res, next) {
    try {
      const { setupToken } = req.body;

      logger.debug({}, "Establish session request received");
      if (!setupToken) {
        logger.warn({}, "Establish session called without setup token");
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Setup token is required",
        });
      }

      // Verify the setup token
      const decoded = JwtUtil.verifyToken(setupToken);

      if (!decoded || decoded.type !== "setup") {
        logger.warn({}, "Invalid or expired setup token");
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Invalid or expired setup token",
        });
      }

      // Revoke any existing tokens from this device to prevent duplicates
      // This handles cases where establishSession is called multiple times (React re-renders)
      const metadata = this.getClientMetadata(req);
      if (metadata.userAgent) {
        const existingTokens =
          await this.service.repository.getUserActiveTokens(decoded.id);
        const tokensToRevoke = existingTokens.filter(
          (token) =>
            token.userAgent === metadata.userAgent &&
            token.ipAddress === metadata.ipAddress,
        );
        for (const token of tokensToRevoke) {
          await this.service.repository.revokeRefreshToken(token.token);
        }
      }

      // Generate real session tokens
      const accessToken = JwtUtil.generateAccessToken(
        decoded.id,
        decoded.email,
      );
      const refreshToken = JwtUtil.generateRefreshToken(
        decoded.id,
        decoded.email,
      );

      // Store refresh token in database
      await this.service.storeRefreshToken(decoded.id, refreshToken, metadata);

      // Set HTTP-only cookies (via proxy, these will be on frontend domain)
      res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
      res.cookie(
        "refreshToken",
        refreshToken,
        getCookieOptions(7 * 24 * 60 * 60 * 1000),
      );

      logger.info({ userId: decoded.id }, "Session established successfully");
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Session established successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
