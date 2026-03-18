import { v4 as uuidv4 } from 'uuid';

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants/http.js';
import { NotFoundError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import AuthRepository from '../auth/auth.repository.js';

import ApiKeyRepository from './apikey.repository.js';

export class ApiKeyService {
  constructor() {
    this.repository = new ApiKeyRepository();
    this.authRepository = new AuthRepository();
  }

  _generateRandomApiKey() {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sk_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async generateApiKey(userId) {
    // Verify user exists
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      logger.warn({ userId }, 'User not found for API key generation');
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Generate a random API key
    const apiKey = this._generateRandomApiKey();

    // Create API key record
    const newApiKey = await this.repository.createApiKey({
      id: uuidv4(),
      userId,
      apiKey,
    });

    logger.info({ userId, apiKeyId: newApiKey.id }, 'API key generated');

    return {
      id: newApiKey.id,
      apiKey: newApiKey.apiKey,
      createdAt: newApiKey.createdAt,
      message: SUCCESS_MESSAGES.API_KEY_GENERATED,
    };
  }

  async getApiKeys(userId) {
    // Verify user exists
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      logger.warn({ userId }, 'User not found for API key retrieval');
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    logger.debug({ userId }, 'Fetching API keys from database');
    const apiKeys = await this.repository.findApiKeysByUserId(userId);
    logger.debug(
      { userId, count: apiKeys.length },
      'API keys fetched from database',
    );

    return {
      userId,
      apiKeys: apiKeys.map((key) => ({
        id: key.id,
        apiKey: this._maskApiKey(key.apiKey),
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      })),
      total: apiKeys.length,
    };
  }

  async deleteApiKey(userId, apiKeyId) {
    // Verify user exists
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      logger.warn({ userId }, 'User not found for API key deletion');
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Find API key by ID
    logger.debug({ apiKeyId }, 'Fetching API key details');
    const apiKey = await this.repository.findApiKeyById(apiKeyId);
    if (!apiKey) {
      logger.warn({ apiKeyId }, 'API key not found');
      throw new NotFoundError(ERROR_MESSAGES.API_KEY_NOT_FOUND);
    }

    // Verify API key belongs to user
    if (apiKey.userId !== userId) {
      logger.warn({ userId, apiKeyId }, 'API key ownership mismatch');
      throw new NotFoundError(ERROR_MESSAGES.API_KEY_NOT_FOUND);
    }

    // Delete API key
    logger.debug({ apiKeyId, userId }, 'Deleting API key from database');
    const deletedKey = await this.repository.deleteApiKey(apiKeyId);

    logger.info({ userId, apiKeyId }, 'API key deleted');

    return {
      message: SUCCESS_MESSAGES.API_KEY_DELETED,
      deletedId: deletedKey.id,
    };
  }

  async verifyApiKey(apiKey) {
    const key = await this.repository.findApiKeyByKey(apiKey);
    if (!key) {
      return null;
    }

    return {
      id: key.id,
      userId: key.userId,
      apiKey: key.apiKey,
    };
  }

  _maskApiKey(apiKey) {
    // Show only first 4 and last 4 characters
    if (apiKey.length <= 8) {
      return apiKey;
    }
    return (
      apiKey.substring(0, 4) +
      '*'.repeat(apiKey.length - 8) +
      apiKey.substring(apiKey.length - 4)
    );
  }
}

export default ApiKeyService;
