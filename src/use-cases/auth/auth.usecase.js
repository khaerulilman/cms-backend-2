import { v4 as uuidv4 } from 'uuid';

import { ERROR_MESSAGES } from '../../entities/constants/http.js';
import {
  ConflictError,
  AuthenticationError,
  NotFoundError,
} from '../../entities/errors/index.js';
import logger from '../../frameworks/logging/logger.js';

export class AuthUseCase {

  constructor({ authRepository, hashService, jwtService }) {
    this.repository = authRepository;
    this.hashService = hashService;
    this.jwtService = jwtService;
  }

  async register(email, password, name, metadata = {}) {
    logger.debug({ email }, 'Register use-case called');
    const existingUser = await this.repository.findUserByEmail(email);
    if (existingUser) {
      logger.warn({ email }, 'User already exists');
      throw new ConflictError(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await this.hashService.hashPassword(password);

    const user = await this.repository.createUser({
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
    });

    const accessToken = this.jwtService.generateAccessToken(user.id, user.email);
    const refreshToken = this.jwtService.generateRefreshToken(user.id, user.email);

    await this._storeRefreshToken(user.id, refreshToken, metadata);

    logger.info({ userId: user.id, email: user.email }, 'User registered');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(email, password, metadata = {}) {
    logger.debug({ email }, 'Login use-case called');
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      logger.warn({ email }, 'Login attempt with non-existent user');
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await this.hashService.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      logger.warn({ email }, 'Login attempt with invalid password');
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const accessToken = this.jwtService.generateAccessToken(user.id, user.email);
    const refreshToken = this.jwtService.generateRefreshToken(user.id, user.email);

    await this._storeRefreshToken(user.id, refreshToken, metadata);

    logger.info({ userId: user.id, email: user.email }, 'User logged in');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken, metadata = {}) {
    logger.debug({}, 'Refresh token use-case called');
    if (!refreshToken) {
      logger.warn({}, 'Refresh token is missing');
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const decoded = this.jwtService.verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      logger.warn({}, 'Invalid or mismatched refresh token type');
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const storedToken = await this.repository.findRefreshToken(refreshToken);
    if (!storedToken) {
      logger.warn({ userId: decoded.id }, 'Stored refresh token not found');
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    if (storedToken.isRevoked) {
      logger.warn({ userId: decoded.id }, 'Refresh token is revoked');
      throw new AuthenticationError(ERROR_MESSAGES.TOKEN_REVOKED);
    }

    if (new Date() > storedToken.expiresAt) {
      logger.warn({ userId: decoded.id }, 'Refresh token is expired');
      throw new AuthenticationError(ERROR_MESSAGES.REFRESH_TOKEN_EXPIRED);
    }

    const user = await this.repository.findUserById(decoded.id);
    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    await this.repository.revokeRefreshToken(refreshToken);

    const accessToken = this.jwtService.generateAccessToken(user.id, user.email);
    const newRefreshToken = this.jwtService.generateRefreshToken(user.id, user.email);

    await this._storeRefreshToken(user.id, newRefreshToken, metadata);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async getProfile(userId) {
    logger.debug({ userId }, 'Get profile use-case called');
    const user = await this.repository.findUserById(userId);
    if (!user) {
      logger.warn({ userId }, 'User not found');
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async logout(refreshToken) {
    logger.debug({}, 'Logout use-case called');
    if (refreshToken) {
      const storedToken = await this.repository.findRefreshToken(refreshToken);
      if (storedToken && !storedToken.isRevoked) {
        await this.repository.revokeRefreshToken(refreshToken);
        logger.info({ userId: storedToken.userId }, 'User logged out');
      }
    }
  }

  async logoutAllDevices(userId) {
    logger.debug({ userId }, 'Logout all devices use-case called');
    await this.repository.revokeAllUserTokens(userId);
    logger.info({ userId }, 'User logged out from all devices');
  }

  async getActiveSessions(userId) {
    logger.debug({ userId }, 'Get active sessions use-case called');
    const tokens = await this.repository.getUserActiveTokens(userId);
    return tokens.map((token) => ({
      id: token.id,
      userAgent: token.userAgent,
      ipAddress: token.ipAddress,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
    }));
  }

  async cleanupExpiredTokens() {
    logger.debug({}, 'Cleanup expired tokens use-case called');
    const result = await this.repository.deleteExpiredTokens();
    logger.info({ deletedCount: result.count }, 'Expired tokens cleaned up');
    return result;
  }

  async _storeRefreshToken(userId, token, metadata = {}) {
    const decoded = this.jwtService.verifyToken(token);
    logger.debug(
      { userId, hasMetadata: !!metadata.userAgent },
      'Storing refresh token',
    );
    try {
      await this.repository.deleteRefreshToken(token);
    } catch {
      // Token doesn't exist, safe to ignore
    }

    return this.repository.createRefreshToken({
      id: uuidv4(),
      userId,
      token,
      expiresAt: new Date(decoded.exp * 1000),
      userAgent: metadata.userAgent || null,
      ipAddress: metadata.ipAddress || null,
    });
  }
}

export default AuthUseCase;
