import bcrypt from 'bcryptjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { HashUtil } from '../hash.js';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    genSalt: vi.fn(),
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('HashUtil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with salt rounds of 10', async () => {
      const password = 'mySecurePassword123';
      const mockSalt = 'mocked-salt';
      const mockHash = 'mocked-hashed-password';

      bcrypt.genSalt.mockResolvedValue(mockSalt);
      bcrypt.hash.mockResolvedValue(mockHash);

      const result = await HashUtil.hashPassword(password);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, mockSalt);
      expect(result).toBe(mockHash);
    });

    it('should generate different hash for same password', async () => {
      const password = 'samePassword';

      bcrypt.genSalt
        .mockResolvedValueOnce('salt1')
        .mockResolvedValueOnce('salt2');
      bcrypt.hash.mockResolvedValueOnce('hash1').mockResolvedValueOnce('hash2');

      const hash1 = await HashUtil.hashPassword(password);
      const hash2 = await HashUtil.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed-empty');

      const result = await HashUtil.hashPassword('');

      expect(bcrypt.hash).toHaveBeenCalledWith('', 'salt');
      expect(result).toBe('hashed-empty');
    });

    it('should handle special characters in password', async () => {
      const specialPassword = 'P@$$w0rd!#$%^&*()';

      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed-special');

      const result = await HashUtil.hashPassword(specialPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(specialPassword, 'salt');
      expect(result).toBe('hashed-special');
    });

    it('should throw error when hashing fails', async () => {
      bcrypt.genSalt.mockRejectedValue(new Error('Hashing error'));

      await expect(HashUtil.hashPassword('password')).rejects.toThrow(
        'Hashing error',
      );
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await HashUtil.comparePassword(
        'password',
        'hashedPassword',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await HashUtil.comparePassword(
        'wrongPassword',
        'hashedPassword',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongPassword',
        'hashedPassword',
      );
      expect(result).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await HashUtil.comparePassword('', 'hashedPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('', 'hashedPassword');
      expect(result).toBe(false);
    });

    it('should throw error when comparison fails', async () => {
      bcrypt.compare.mockRejectedValue(new Error('Comparison error'));

      await expect(
        HashUtil.comparePassword('password', 'hashedPassword'),
      ).rejects.toThrow('Comparison error');
    });

    it('should handle special characters in password comparison', async () => {
      const specialPassword = 'P@$$w0rd!#$%^&*()';

      bcrypt.compare.mockResolvedValue(true);

      const result = await HashUtil.comparePassword(
        specialPassword,
        'hashedPassword',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        specialPassword,
        'hashedPassword',
      );
      expect(result).toBe(true);
    });
  });
});
