import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ApiKeyController } from '../apikey.controller.js';

describe('ApiKeyController', () => {
  let controller;
  let mockService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      generateApiKey: vi.fn(),
      getApiKeys: vi.fn(),
      deleteApiKey: vi.fn(),
    };

    controller = new ApiKeyController();
    controller.service = mockService;

    mockReq = {
      user: { id: 'user-123' },
      params: {},
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('generateApiKey', () => {
    it('should return 201 with generated API key', async () => {
      const mockServiceResult = {
        id: 'key-1',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
        message: 'API key generated successfully',
      };

      const expectedResponse = {
        success: true,
        message: 'API key generated successfully',
        data: {
          id: 'key-1',
          apiKey: 'sk_test123',
          createdAt: new Date('2025-01-15'),
        },
      };

      mockService.generateApiKey.mockResolvedValue(mockServiceResult);

      await controller.generateApiKey(mockReq, mockRes, mockNext);

      expect(mockService.generateApiKey).toHaveBeenCalledWith('user-123');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      const error = new Error('Service error');
      mockService.generateApiKey.mockRejectedValue(error);

      await controller.generateApiKey(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('getApiKeys', () => {
    it('should return 200 with list of API keys', async () => {
      const mockServiceResult = {
        userId: 'user-123',
        apiKeys: [
          {
            id: 'key-1',
            apiKey: 'sk_a****f',
            createdAt: new Date('2025-01-15'),
            updatedAt: new Date('2025-01-15'),
          },
        ],
        total: 1,
      };

      const expectedResponse = {
        success: true,
        message: 'API keys retrieved successfully',
        data: {
          userId: 'user-123',
          apiKeys: [
            {
              id: 'key-1',
              apiKey: 'sk_a****f',
              createdAt: new Date('2025-01-15'),
              updatedAt: new Date('2025-01-15'),
            },
          ],
          total: 1,
        },
      };

      mockService.getApiKeys.mockResolvedValue(mockServiceResult);

      await controller.getApiKeys(mockReq, mockRes, mockNext);

      expect(mockService.getApiKeys).toHaveBeenCalledWith('user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      const error = new Error('Service error');
      mockService.getApiKeys.mockRejectedValue(error);

      await controller.getApiKeys(mockReq, mockRes, mockNext);

      expect(mockService.getApiKeys).toHaveBeenCalledWith('user-123');
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteApiKey', () => {
    it('should return 200 when API key is deleted', async () => {
      const apiKeyId = 'key-1';
      mockReq.params = { apiKeyId };

      const mockServiceResult = {
        message: 'API key deleted successfully',
      };

      const expectedResponse = {
        success: true,
        message: 'API key deleted successfully',
        data: {
          deletedId: undefined,
        },
      };

      mockService.deleteApiKey.mockResolvedValue(mockServiceResult);

      await controller.deleteApiKey(mockReq, mockRes, mockNext);

      expect(mockService.deleteApiKey).toHaveBeenCalledWith(
        'user-123',
        apiKeyId,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should include deletedId in response if provided', async () => {
      const apiKeyId = 'key-1';
      mockReq.params = { apiKeyId };

      const mockServiceResult = {
        message: 'API key deleted successfully',
        deletedId: apiKeyId,
      };

      const expectedResponse = {
        success: true,
        message: 'API key deleted successfully',
        data: {
          deletedId: 'key-1',
        },
      };

      mockService.deleteApiKey.mockResolvedValue(mockServiceResult);

      await controller.deleteApiKey(mockReq, mockRes, mockNext);

      expect(mockService.deleteApiKey).toHaveBeenCalledWith(
        'user-123',
        apiKeyId,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      const error = new Error('Service error');
      mockReq.params = { apiKeyId: 'key-1' };
      mockService.deleteApiKey.mockRejectedValue(error);

      await controller.deleteApiKey(mockReq, mockRes, mockNext);

      expect(mockService.deleteApiKey).toHaveBeenCalledWith(
        'user-123',
        'key-1',
      );
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
