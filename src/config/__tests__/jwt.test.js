import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { config } from '../env.js';
import { JwtConfig } from '../jwt.js';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
    decode: vi.fn(),
  },
}));

describe('JwtConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate token with default expiration (7 days)', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const mockToken = 'mocked-jwt-token';

      jwt.sign.mockReturnValue(mockToken);

      const token = JwtConfig.generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, config.JWT_SECRET, {
        expiresIn: '7d',
        algorithm: 'HS256',
      });
      expect(token).toBe(mockToken);
    });

    it('should generate token with custom expiration', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const mockToken = 'mocked-jwt-token';
      const customExpiry = '1h';

      jwt.sign.mockReturnValue(mockToken);

      const token = JwtConfig.generateToken(payload, customExpiry);

      expect(jwt.sign).toHaveBeenCalledWith(payload, config.JWT_SECRET, {
        expiresIn: customExpiry,
        algorithm: 'HS256',
      });
      expect(token).toBe(mockToken);
    });

    it('should use HS256 algorithm', () => {
      const payload = { userId: '123' };
      jwt.sign.mockReturnValue('token');

      JwtConfig.generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          algorithm: 'HS256',
        }),
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', () => {
      const token = 'valid-token';
      const mockPayload = { userId: '123', email: 'test@example.com' };

      jwt.verify.mockReturnValue(mockPayload);

      const result = JwtConfig.verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, config.JWT_SECRET, {
        algorithms: ['HS256'],
      });
      expect(result).toEqual(mockPayload);
    });

    it('should return null for invalid token', () => {
      const token = 'invalid-token';

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = JwtConfig.verifyToken(token);

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      const token = 'expired-token';

      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const result = JwtConfig.verifyToken(token);

      expect(result).toBeNull();
    });

    it('should use HS256 algorithm for verification', () => {
      const token = 'valid-token';
      jwt.verify.mockReturnValue({ userId: '123' });

      JwtConfig.verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          algorithms: ['HS256'],
        }),
      );
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = 'valid-token';
      const mockPayload = {
        userId: '123',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };

      jwt.decode.mockReturnValue(mockPayload);

      const result = JwtConfig.decodeToken(token);

      expect(jwt.decode).toHaveBeenCalledWith(token);
      expect(result).toEqual(mockPayload);
    });

    it('should return null for malformed token', () => {
      const token = 'malformed-token';

      jwt.decode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = JwtConfig.decodeToken(token);

      expect(result).toBeNull();
    });

    it('should decode without verifying signature', () => {
      const token = 'token-with-invalid-signature';
      const mockPayload = { userId: '123' };

      jwt.decode.mockReturnValue(mockPayload);

      const result = JwtConfig.decodeToken(token);

      expect(jwt.decode).toHaveBeenCalledWith(token);
      expect(result).toEqual(mockPayload);
    });
  });
});
