import { describe, it, expect, beforeEach, vi } from "vitest";

import JwtConfig from "../../config/jwt.js";
import { JwtUtil } from "../jwt.js";

// Mock JwtConfig
vi.mock("../../config/jwt.js", () => ({
  default: {
    generateToken: vi.fn(),
    verifyToken: vi.fn(),
    decodeToken: vi.fn(),
  },
}));

describe("JwtUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateAccessToken", () => {
    it("should generate access token with correct payload", () => {
      const mockToken = "mocked-access-token";
      JwtConfig.generateToken.mockReturnValue(mockToken);

      const token = JwtUtil.generateAccessToken("user-123", "test@example.com");

      expect(JwtConfig.generateToken).toHaveBeenCalledWith(
        {
          id: "user-123",
          email: "test@example.com",
          type: "access",
        },
        "7d",
      );
      expect(token).toBe(mockToken);
    });

    it("should set expiration to 7 days", () => {
      JwtConfig.generateToken.mockReturnValue("token");

      JwtUtil.generateAccessToken("user-123", "test@example.com");

      expect(JwtConfig.generateToken).toHaveBeenCalledWith(
        expect.any(Object),
        "7d",
      );
    });

    it("should include type access in payload", () => {
      JwtConfig.generateToken.mockReturnValue("token");

      JwtUtil.generateAccessToken("user-123", "test@example.com");

      expect(JwtConfig.generateToken).toHaveBeenCalledWith(
        expect.objectContaining({ type: "access" }),
        expect.any(String),
      );
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate refresh token with correct payload", () => {
      const mockToken = "mocked-refresh-token";
      JwtConfig.generateToken.mockReturnValue(mockToken);

      const token = JwtUtil.generateRefreshToken(
        "user-456",
        "user@example.com",
      );

      expect(JwtConfig.generateToken).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "user-456",
          email: "user@example.com",
          type: "refresh",
          jti: expect.any(String),
        }),
        "30d",
      );
      expect(token).toBe(mockToken);
    });

    it("should set expiration to 30 days", () => {
      JwtConfig.generateToken.mockReturnValue("token");

      JwtUtil.generateRefreshToken("user-456", "user@example.com");

      expect(JwtConfig.generateToken).toHaveBeenCalledWith(
        expect.any(Object),
        "30d",
      );
    });

    it("should include type refresh in payload", () => {
      JwtConfig.generateToken.mockReturnValue("token");

      JwtUtil.generateRefreshToken("user-456", "user@example.com");

      expect(JwtConfig.generateToken).toHaveBeenCalledWith(
        expect.objectContaining({ type: "refresh" }),
        expect.any(String),
      );
    });
  });

  describe("verifyToken", () => {
    it("should verify token and return payload", () => {
      const mockPayload = {
        id: "user-123",
        email: "test@example.com",
        type: "access",
      };
      JwtConfig.verifyToken.mockReturnValue(mockPayload);

      const result = JwtUtil.verifyToken("valid-token");

      expect(JwtConfig.verifyToken).toHaveBeenCalledWith("valid-token");
      expect(result).toEqual(mockPayload);
    });

    it("should throw error for invalid token", () => {
      JwtConfig.verifyToken.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      expect(() => JwtUtil.verifyToken("invalid-token")).toThrow(
        "Invalid token",
      );
    });

    it("should throw error for expired token", () => {
      JwtConfig.verifyToken.mockImplementation(() => {
        throw new Error("Token expired");
      });

      expect(() => JwtUtil.verifyToken("expired-token")).toThrow(
        "Token expired",
      );
    });
  });

  describe("decodeToken", () => {
    it("should decode token without verification", () => {
      const mockPayload = {
        id: "user-123",
        email: "test@example.com",
        type: "access",
        iat: 1234567890,
        exp: 1234567890,
      };
      JwtConfig.decodeToken.mockReturnValue(mockPayload);

      const result = JwtUtil.decodeToken("any-token");

      expect(JwtConfig.decodeToken).toHaveBeenCalledWith("any-token");
      expect(result).toEqual(mockPayload);
    });

    it("should return null for invalid token format", () => {
      JwtConfig.decodeToken.mockReturnValue(null);

      const result = JwtUtil.decodeToken("malformed-token");

      expect(result).toBeNull();
    });

    it("should decode even expired token", () => {
      const mockPayload = {
        id: "user-123",
        exp: 0, // expired
      };
      JwtConfig.decodeToken.mockReturnValue(mockPayload);

      const result = JwtUtil.decodeToken("expired-token");

      expect(result).toEqual(mockPayload);
    });
  });
});
