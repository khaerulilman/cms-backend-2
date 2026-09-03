import { v4 as uuidv4 } from 'uuid';

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../entities/constants/http.js';
import { NotFoundError } from '../../entities/errors/index.js';
import logger from '../../frameworks/logging/logger.js';

export class ApiKeyUseCase {

  constructor({ apiKeyRepository, authRepository }) {
    this.repository = apiKeyRepository;
    this.authRepository = authRepository;
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

  _maskApiKey(apiKey) {
    if (apiKey.length <= 8) return apiKey;
    return (
      apiKey.substring(0, 4) +
      '*'.repeat(apiKey.length - 8) +
      apiKey.substring(apiKey.length - 4)
    );
  }

  async generateApiKey(userId) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      logger.warn({ userId }, 'User not found for API key generation');
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const apiKey = this._generateRandomApiKey();

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
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      logger.warn({ userId }, 'User not found for API key retrieval');
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    logger.debug({ userId }, 'Fetching API keys from database');
    const apiKeys = await this.repository.findApiKeysByUserId(userId);

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
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      logger.warn({ userId }, 'User not found for API key deletion');
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const apiKey = await this.repository.findApiKeyById(apiKeyId);
    if (!apiKey) {
      logger.warn({ apiKeyId }, 'API key not found');
      throw new NotFoundError(ERROR_MESSAGES.API_KEY_NOT_FOUND);
    }

    if (apiKey.userId !== userId) {
      logger.warn({ userId, apiKeyId }, 'API key ownership mismatch');
      throw new NotFoundError(ERROR_MESSAGES.API_KEY_NOT_FOUND);
    }

    const deletedKey = await this.repository.deleteApiKey(apiKeyId);

    logger.info({ userId, apiKeyId }, 'API key deleted');

    return {
      message: SUCCESS_MESSAGES.API_KEY_DELETED,
      deletedId: deletedKey.id,
    };
  }

  async verifyApiKey(apiKey) {
    const key = await this.repository.findApiKeyByKey(apiKey);
    if (!key) return null;
    return { id: key.id, userId: key.userId, apiKey: key.apiKey };
  }
}

export default ApiKeyUseCase;
