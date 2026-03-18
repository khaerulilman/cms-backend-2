import { describe, it, expect, beforeEach, vi } from 'vitest';

import prisma from '../../../prisma/client.js';
import { AuthRepository } from '../auth.repository.js';

vi.mock('../../../prisma/client.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('AuthRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new AuthRepository();
    vi.clearAllMocks();
  });

  describe('findUserByEmail', () => {
    it('should return user when found by email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15'),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUserByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findUserByEmail(
        'nonexistent@example.com',
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should return user when found by id', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15'),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUserById('user-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by id', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findUserById('non-existent-user');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-user' },
      });
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const inputData = {
        id: 'user-456',
        email: 'newuser@example.com',
        password: 'hashed_password',
        name: 'New User',
      };

      const mockCreatedUser = {
        id: 'user-456',
        email: 'newuser@example.com',
        password: 'hashed_password',
        name: 'New User',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15'),
      };

      prisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await repository.createUser(inputData);

      expect(prisma.user.create).toHaveBeenCalledWith({ data: inputData });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should handle user creation with minimal data', async () => {
      const inputData = {
        id: 'user-789',
        email: 'minimal@example.com',
        password: 'hashed',
        name: 'Minimal User',
      };

      const mockCreatedUser = {
        ...inputData,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15'),
      };

      prisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await repository.createUser(inputData);

      expect(prisma.user.create).toHaveBeenCalledWith({ data: inputData });
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const updateData = {
        name: 'Updated User',
        updatedAt: new Date('2025-01-20'),
      };

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Updated User',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-20'),
      };

      prisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await repository.updateUser('user-123', updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should update multiple fields', async () => {
      const updateData = {
        email: 'newemail@example.com',
        name: 'New Name',
        updatedAt: new Date('2025-01-20'),
      };

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'newemail@example.com',
        password: 'hashed_password',
        name: 'New Name',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-20'),
      };

      prisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await repository.updateUser('user-123', updateData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw error if user not found during update', async () => {
      const error = new Error('Record not found');
      prisma.user.update.mockRejectedValue(error);

      await expect(
        repository.updateUser('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(error);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
        data: { name: 'New Name' },
      });
    });
  });
});
