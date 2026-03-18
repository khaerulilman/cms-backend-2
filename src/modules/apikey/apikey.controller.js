import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../constants/http.js';
import logger from '../../utils/logger.js';

import ApiKeyService from './apikey.service.js';

export class ApiKeyController {
  constructor() {
    this.service = new ApiKeyService();
  }

  async generateApiKey(req, res, next) {
    try {
      const userId = req.user.id;

      logger.debug({ userId }, 'Generating new API key');
      const result = await this.service.generateApiKey(userId);

      logger.info(
        { userId, apiKeyId: result.id },
        'API key generated successfully',
      );
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: result.message,
        data: {
          id: result.id,
          apiKey: result.apiKey,
          createdAt: result.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getApiKeys(req, res, next) {
    try {
      const userId = req.user.id;

      logger.debug({ userId }, 'Fetching API keys');
      const result = await this.service.getApiKeys(userId);

      logger.debug({ userId, count: result.total }, 'API keys retrieved');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.API_KEYS_RETRIEVED,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteApiKey(req, res, next) {
    try {
      const userId = req.user.id;
      const { apiKeyId } = req.params;

      logger.debug({ userId, apiKeyId }, 'Deleting API key');
      const result = await this.service.deleteApiKey(userId, apiKeyId);

      logger.info({ userId, apiKeyId }, 'API key deleted successfully');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
        data: {
          deletedId: result.deletedId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ApiKeyController;
