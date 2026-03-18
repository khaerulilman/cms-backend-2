import { describe, it, expect, beforeEach, vi } from 'vitest';

import { NotFoundError } from '../../../utils/errors.js';
import { ApiKeyService } from '../apikey.service.js';

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mocked-uuid-123'),
}));

describe('ApiKeyService', () => {
  let service;
  let mockRepository;
  let mockAuthRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      findApiKeysByUserId: vi.fn(),
      findApiKeyById: vi.fn(),
      findApiKeyByKey: vi.fn(),
      createApiKey: vi.fn(),
      deleteApiKey: vi.fn(),
      updateApiKey: vi.fn(),
    };

    mockAuthRepository = {
      findUserById: vi.fn(),
    };

    service = new ApiKeyService();
    // Replace the repository instances with our mocks
    service.repository = mockRepository;
    service.authRepository = mockAuthRepository;
  });

  describe('generateApiKey', () => {
    it('should generate a new API key for valid user', async () => {
      const userId = 'user-123';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
      };

      const mockCreatedApiKey = {
        id: 'mocked-uuid-123',
        userId,
        apiKey: 'sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        createdAt: new Date('2025-01-15'),
      };

      mockAuthRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.createApiKey.mockResolvedValue(mockCreatedApiKey);

      const result = await service.generateApiKey(userId);

      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.createApiKey).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          userId: userId,
          apiKey: expect.stringMatching(/^sk_[A-Za-z0-9]{32}$/),
        }),
      );
      expect(result).toEqual({
        id: 'mocked-uuid-123',

        apiKey: 'sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        createdAt: new Date('2025-01-15'),
        message: 'API key generated successfully',
      });
    });

    it('should throw NotFoundError if user does not exist', async () => {
      const userId = 'non-existent-user';
      mockAuthRepository.findUserById.mockResolvedValue(null);

      await expect(service.generateApiKey(userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.createApiKey).not.toHaveBeenCalled();
    });

    it('should generate API key with sk_ prefix', () => {
      const generatedKey = service._generateRandomApiKey();

      expect(generatedKey).toMatch(/^sk_[A-Za-z0-9]{32}$/);
      expect(generatedKey.length).toBe(35); // sk_ (3) + 32 chars
    });
  });

  describe('getApiKeys', () => {
    it('should return masked API keys for user', async () => {
      const userId = 'user-123';

      const mockUser = { id: userId };

      const mockApiKeys = [
        {
          id: 'key-1',
          userId,
          apiKey: 'sk_test1234567890123456789012',
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15'),
        },
        {
          id: 'key-2',
          userId,
          apiKey: 'sk_abcd1234567890123456789012ab',
          createdAt: new Date('2025-01-10'),
          updatedAt: new Date('2025-01-10'),
        },
      ];

      mockAuthRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.findApiKeysByUserId.mockResolvedValue(mockApiKeys);

      const result = await service.getApiKeys(userId);

      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findApiKeysByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        userId: userId,
        total: 2,
        apiKeys: [
          {
            id: 'key-1',
            apiKey: expect.stringMatching(/^sk_t\*+9012$/),
            createdAt: new Date('2025-01-15'),
            updatedAt: new Date('2025-01-15'),
          },
          {
            id: 'key-2',
            apiKey: expect.stringMatching(/^sk_a\*+12ab$/),
            createdAt: new Date('2025-01-10'),
            updatedAt: new Date('2025-01-10'),
          },
        ],
      });
    });

    it('should throw NotFoundError if user does not exist', async () => {
      const userId = 'non-existent-user';
      mockAuthRepository.findUserById.mockResolvedValue(null);

      await expect(service.getApiKeys(userId)).rejects.toThrow(NotFoundError);

      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findApiKeysByUserId).not.toHaveBeenCalled();
    });

    it('should return empty array if user has no API keys', async () => {
      const userId = 'user-123';
      const mockUser = { id: userId };
      const mockApiKeys = [];

      mockAuthRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.findApiKeysByUserId.mockResolvedValue(mockApiKeys);

      const result = await service.getApiKeys(userId);

      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findApiKeysByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        userId: userId,
        total: 0,
        apiKeys: [],
      });
    });
  });

  describe('deleteApiKey', () => {
    it('should delete API key if it belongs to user', async () => {
      const userId = 'user-123';
      const apiKeyId = 'key-1';

      const mockUser = { id: userId };
      const mockApiKey = {
        id: apiKeyId,
        userId,
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
      };
      const mockDeletedApiKey = {
        id: apiKeyId,
        userId,
      };

      mockAuthRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.findApiKeyById.mockResolvedValue(mockApiKey);
      mockRepository.deleteApiKey.mockResolvedValue(mockDeletedApiKey);

      const result = await service.deleteApiKey(userId, apiKeyId);

      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findApiKeyById).toHaveBeenCalledWith(apiKeyId);
      expect(mockRepository.deleteApiKey).toHaveBeenCalledWith(apiKeyId);
      expect(result).toEqual({
        message: 'API key deleted successfully',
        deletedId: 'key-1',
      });
    });

    it('should throw NotFoundError if user does not exist', async () => {
      const userId = 'non-existent-user';
      mockAuthRepository.findUserById.mockResolvedValue(null);

      await expect(service.deleteApiKey(userId, 'key-1')).rejects.toThrow(
        NotFoundError,
      );

      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findApiKeyById).not.toHaveBeenCalled();
      expect(mockRepository.deleteApiKey).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if API key does not exist', async () => {
      const userId = 'user-123';
      const mockUser = { id: userId };

      mockAuthRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.findApiKeyById.mockResolvedValue(null);

      await expect(
        service.deleteApiKey(userId, 'non-existent'),
      ).rejects.toThrow(NotFoundError);

      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findApiKeyById).toHaveBeenCalledWith(
        'non-existent',
      );
      expect(mockRepository.deleteApiKey).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if API key does not belong to user', async () => {
      const userId = 'user-123';
      const apiKeyId = 'key-1';

      const mockUser = { id: userId };
      const mockApiKey = {
        id: apiKeyId,
        userId: 'other-user',
        apiKey: 'sk_test123',
      };

      mockAuthRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.findApiKeyById.mockResolvedValue(mockApiKey);

      await expect(service.deleteApiKey(userId, apiKeyId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findApiKeyById).toHaveBeenCalledWith(apiKeyId);
      expect(mockRepository.deleteApiKey).not.toHaveBeenCalled();
    });
  });

  describe('verifyApiKey', () => {
    it('should return key details if API key is valid', async () => {
      const apiKey = 'sk_test123';
      const mockApiKey = {
        id: 'key-1',
        userId: 'user-123',
        apiKey,
      };

      mockRepository.findApiKeyByKey.mockResolvedValue(mockApiKey);

      const result = await service.verifyApiKey(apiKey);

      expect(mockRepository.findApiKeyByKey).toHaveBeenCalledWith(apiKey);
      expect(result).toEqual({
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
      });
    });

    it('should return null if API key is invalid', async () => {
      const apiKey = 'invalid-key';
      mockRepository.findApiKeyByKey.mockResolvedValue(null);

      const result = await service.verifyApiKey(apiKey);

      expect(mockRepository.findApiKeyByKey).toHaveBeenCalledWith(apiKey);
      expect(result).toBeNull();
    });
  });

  describe('_maskApiKey', () => {
    it('should mask API key showing first 4 and last 4 characters', () => {
      const apiKey = 'sk_abcd1234567890123456789012ef';
      const masked = service._maskApiKey(apiKey);

      expect(masked).toBe('sk_a***********************12ef');
    });

    it('should return full key if length is 8 or less', () => {
      const shortKey = 'sk_test';
      const masked = service._maskApiKey(shortKey);

      expect(masked).toBe(shortKey);
    });

    it('should correctly mask keys of different lengths', () => {
      const key30 = 'a'.repeat(30);
      const masked = service._maskApiKey(key30);

      expect(masked).toMatch(/^aaaa\*{22}aaaa$/);
    });
  });
});
