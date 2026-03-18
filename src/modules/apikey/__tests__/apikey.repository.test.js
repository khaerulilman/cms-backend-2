import { describe, it, expect, beforeEach, vi } from 'vitest';

import prisma from '../../../prisma/client.js';
import { ApiKeyRepository } from '../apikey.repository.js';

vi.mock('../../../prisma/client.js', () => ({
  default: {
    apiKey: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('ApiKeyRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new ApiKeyRepository();
    vi.clearAllMocks();
  });

  describe('findApiKeysByUserId', () => {
    it('should return all API keys for a user ordered by creation date', async () => {
      const userId = 'user-123';
      const mockDatabaseKeys = [
        {
          id: 'key-1',
          userId,
          apiKey: 'sk_test123',
          createdAt: new Date('2025-01-15'),
        },
        {
          id: 'key-2',
          userId,
          apiKey: 'sk_test456',
          createdAt: new Date('2025-01-10'),
        },
      ];

      prisma.apiKey.findMany.mockResolvedValue(mockDatabaseKeys);

      const result = await repository.findApiKeysByUserId(userId);

      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([
        {
          id: 'key-1',
          userId: 'user-123',
          apiKey: 'sk_test123',
          createdAt: new Date('2025-01-15'),
        },
        {
          id: 'key-2',
          userId: 'user-123',
          apiKey: 'sk_test456',
          createdAt: new Date('2025-01-10'),
        },
      ]);
    });

    it('should return empty array if user has no API keys', async () => {
      const userId = 'user-no-keys';
      prisma.apiKey.findMany.mockResolvedValue([]);

      const result = await repository.findApiKeysByUserId(userId);

      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('findApiKeyById', () => {
    it('should return API key by id', async () => {
      const mockDatabaseKey = {
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
      };

      prisma.apiKey.findUnique.mockResolvedValue(mockDatabaseKey);

      const result = await repository.findApiKeyById('key-1');

      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { id: 'key-1' },
      });
      expect(result).toEqual({
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
      });
    });

    it('should return null if API key not found', async () => {
      prisma.apiKey.findUnique.mockResolvedValue(null);

      const result = await repository.findApiKeyById('non-existent');

      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findApiKeyByKey', () => {
    it('should return API key by key value', async () => {
      const mockDatabaseKey = {
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
      };

      prisma.apiKey.findUnique.mockResolvedValue(mockDatabaseKey);

      const result = await repository.findApiKeyByKey('sk_test123');

      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { apiKey: 'sk_test123' },
      });
      expect(result).toEqual({
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
      });
    });

    it('should return null if API key not found', async () => {
      prisma.apiKey.findUnique.mockResolvedValue(null);

      const result = await repository.findApiKeyByKey('sk_nonexistent');

      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { apiKey: 'sk_nonexistent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('createApiKey', () => {
    it('should create a new API key', async () => {
      const inputData = {
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
      };

      const mockCreatedKey = {
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15'),
      };

      prisma.apiKey.create.mockResolvedValue(mockCreatedKey);

      const result = await repository.createApiKey(inputData);

      expect(prisma.apiKey.create).toHaveBeenCalledWith({ data: inputData });
      expect(result).toEqual({
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15'),
      });
    });
  });

  describe('deleteApiKey', () => {
    it('should delete API key by id', async () => {
      const mockDeletedKey = {
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
      };

      prisma.apiKey.delete.mockResolvedValue(mockDeletedKey);

      const result = await repository.deleteApiKey('key-1');

      expect(prisma.apiKey.delete).toHaveBeenCalledWith({
        where: { id: 'key-1' },
      });
      expect(result).toEqual({
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
      });
    });
  });

  describe('deleteApiKeyByKey', () => {
    it('should delete API key by key value', async () => {
      const mockDeletedKey = {
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
      };

      prisma.apiKey.delete.mockResolvedValue(mockDeletedKey);

      const result = await repository.deleteApiKeyByKey('sk_test123');

      expect(prisma.apiKey.delete).toHaveBeenCalledWith({
        where: { apiKey: 'sk_test123' },
      });
      expect(result).toEqual({
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
      });
    });
  });

  describe('updateApiKey', () => {
    it('should update API key data', async () => {
      const updateData = { updatedAt: new Date('2025-01-20') };
      const mockUpdatedKey = {
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-20'),
      };

      prisma.apiKey.update.mockResolvedValue(mockUpdatedKey);

      const result = await repository.updateApiKey('key-1', updateData);

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: updateData,
      });
      expect(result).toEqual({
        id: 'key-1',
        userId: 'user-123',
        apiKey: 'sk_test123',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-20'),
      });
    });
  });
});
