import { describe, it, expect, beforeEach, vi } from "vitest";

import { HTTP_STATUS, ERROR_MESSAGES } from "../../constants/http.js";
import JwtUtil from "../../utils/jwt.js";
import { authMiddleware } from "../auth.middleware.js";

// Mock logger to prevent noise in test output
vi.mock("../../utils/logger.js", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock JWT utility
vi.mock("../../utils/jwt.js", () => ({
  default: {
    verifyToken: vi.fn(),
  },
}));

describe("Auth Middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  describe("Valid Token", () => {
    it("should allow request with valid access token", () => {
      const mockDecodedToken = {
        id: "user-123",
        email: "test@example.com",
        type: "access",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockReq.headers.authorization = "Bearer valid_token_12345";
      JwtUtil.verifyToken.mockReturnValue(mockDecodedToken);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(JwtUtil.verifyToken).toHaveBeenCalledWith("valid_token_12345");
      expect(JwtUtil.verifyToken).toHaveBeenCalledTimes(1);
      expect(mockReq.user).toEqual({
        id: "user-123",
        email: "test@example.com",
      });
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should extract token after 'Bearer ' prefix", () => {
      const mockDecodedToken = {
        id: "user-456",
        email: "another@example.com",
        type: "access",
      };

      mockReq.headers.authorization = "Bearer my_secret_token";
      JwtUtil.verifyToken.mockReturnValue(mockDecodedToken);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(JwtUtil.verifyToken).toHaveBeenCalledWith("my_secret_token");
      expect(mockReq.user.id).toBe("user-456");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should attach user info to request object", () => {
      const mockDecodedToken = {
        id: "user-789",
        email: "user789@example.com",
        type: "access",
      };

      mockReq.headers.authorization = "Bearer token123";
      JwtUtil.verifyToken.mockReturnValue(mockDecodedToken);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user).toEqual({
        id: "user-789",
        email: "user789@example.com",
      });
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("Missing Authorization Header", () => {
    it("should return 401 when authorization header is missing", () => {
      mockReq.headers = {}; // No authorization header

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.NO_TOKEN_PROVIDED,
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
      expect(JwtUtil.verifyToken).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header is empty", () => {
      mockReq.headers.authorization = "";

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.NO_TOKEN_PROVIDED,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header is null", () => {
      mockReq.headers.authorization = null;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.NO_TOKEN_PROVIDED,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header is undefined", () => {
      mockReq.headers.authorization = undefined;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.NO_TOKEN_PROVIDED,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Invalid Authorization Format", () => {
    it("should return 401 when authorization header does not start with 'Bearer'", () => {
      mockReq.headers.authorization = "Basic token123";

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.NO_TOKEN_PROVIDED,
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(JwtUtil.verifyToken).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header is just 'Bearer'", () => {
      mockReq.headers.authorization = "Bearer";

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.NO_TOKEN_PROVIDED,
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(JwtUtil.verifyToken).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header has no space after Bearer", () => {
      mockReq.headers.authorization = "Bearertoken123";
      JwtUtil.verifyToken.mockReturnValue(null);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(JwtUtil.verifyToken).toHaveBeenCalledWith("oken123");
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when token is only whitespace after Bearer", () => {
      mockReq.headers.authorization = "Bearer    ";
      JwtUtil.verifyToken.mockReturnValue(null);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Invalid Token", () => {
    it("should return 401 when token verification returns null", () => {
      mockReq.headers.authorization = "Bearer invalid_token";
      JwtUtil.verifyToken.mockReturnValue(null);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(JwtUtil.verifyToken).toHaveBeenCalledWith("invalid_token");
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when token verification returns undefined", () => {
      mockReq.headers.authorization = "Bearer invalid_token";
      JwtUtil.verifyToken.mockReturnValue(undefined);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when token is expired", () => {
      mockReq.headers.authorization = "Bearer expired_token";
      JwtUtil.verifyToken.mockReturnValue(null); // Expired tokens return null

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when token is malformed", () => {
      mockReq.headers.authorization = "Bearer malformed.token.here";
      JwtUtil.verifyToken.mockReturnValue(null);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Token Type Validation", () => {
    it("should reject refresh token (type is not 'access')", () => {
      const mockDecodedToken = {
        id: "user-123",
        email: "test@example.com",
        type: "refresh", // Wrong type!
      };

      mockReq.headers.authorization = "Bearer refresh_token";
      JwtUtil.verifyToken.mockReturnValue(mockDecodedToken);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(JwtUtil.verifyToken).toHaveBeenCalledWith("refresh_token");
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject token without type field", () => {
      const mockDecodedToken = {
        id: "user-123",
        email: "test@example.com",
        // type field is missing
      };

      mockReq.headers.authorization = "Bearer token_without_type";
      JwtUtil.verifyToken.mockReturnValue(mockDecodedToken);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject token with invalid type", () => {
      const mockDecodedToken = {
        id: "user-123",
        email: "test@example.com",
        type: "invalid_type",
      };

      mockReq.headers.authorization = "Bearer token_invalid_type";
      JwtUtil.verifyToken.mockReturnValue(mockDecodedToken);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should accept only 'access' type tokens", () => {
      const mockDecodedToken = {
        id: "user-123",
        email: "test@example.com",
        type: "access", // Correct type
      };

      mockReq.headers.authorization = "Bearer valid_access_token";
      JwtUtil.verifyToken.mockReturnValue(mockDecodedToken);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should return 401 when JWT verification throws an error", () => {
      mockReq.headers.authorization = "Bearer token_that_throws";
      JwtUtil.verifyToken.mockImplementation(() => {
        throw new Error("JWT verification failed");
      });

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors gracefully", () => {
      mockReq.headers.authorization = "Bearer token";
      JwtUtil.verifyToken.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle null pointer exceptions", () => {
      mockReq.headers.authorization = "Bearer token";
      JwtUtil.verifyToken.mockImplementation(() => {
        throw new TypeError("Cannot read property of null");
      });

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("User Object Structure", () => {
    it("should only attach id and email to req.user", () => {
      const mockDecodedToken = {
        id: "user-123",
        email: "test@example.com",
        type: "access",
        iat: 1234567890,
        exp: 1234567890 + 3600,
        extraField: "should not be included",
      };

      mockReq.headers.authorization = "Bearer valid_token";
      JwtUtil.verifyToken.mockReturnValue(mockDecodedToken);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual({
        id: "user-123",
        email: "test@example.com",
      });
      expect(mockReq.user.type).toBeUndefined();
      expect(mockReq.user.iat).toBeUndefined();
      expect(mockReq.user.exp).toBeUndefined();
      expect(mockReq.user.extraField).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long tokens", () => {
      const longToken = "a".repeat(1000);
      const mockDecodedToken = {
        id: "user-123",
        email: "test@example.com",
        type: "access",
      };

      mockReq.headers.authorization = `Bearer ${longToken}`;
      JwtUtil.verifyToken.mockReturnValue(mockDecodedToken);

      authMiddleware(mockReq, mockRes, mockNext);

      expect(JwtUtil.verifyToken).toHaveBeenCalledWith(longToken);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should handle authorization header with extra spaces", () => {
      const mockDecodedToken = {
        id: "user-123",
        email: "test@example.com",
        type: "access",
      };

      mockReq.headers.authorization = "Bearer  token_with_spaces";
      JwtUtil.verifyToken.mockReturnValue(mockDecodedToken);

      authMiddleware(mockReq, mockRes, mockNext);

      // Token extracted from position 7 onwards, includes the extra space
      expect(JwtUtil.verifyToken).toHaveBeenCalledWith(" token_with_spaces");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should handle case-sensitive 'Bearer' keyword", () => {
      mockReq.headers.authorization = "bearer valid_token";

      authMiddleware(mockReq, mockRes, mockNext);

      // Should fail because it's case-sensitive
      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.NO_TOKEN_PROVIDED,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Response Format", () => {
    it("should always return JSON response with success field", () => {
      mockReq.headers.authorization = "Bearer invalid_token";
      JwtUtil.verifyToken.mockReturnValue(null);

      authMiddleware(mockReq, mockRes, mockNext);

      const call = mockRes.json.mock.calls[0][0];
      expect(call).toHaveProperty("success");
      expect(call).toHaveProperty("message");
      expect(call.success).toBe(false);
    });

    it("should use consistent error response format", () => {
      mockReq.headers = {};

      authMiddleware(mockReq, mockRes, mockNext);

      const call = mockRes.json.mock.calls[0][0];
      expect(call).toEqual({
        success: false,
        message: expect.any(String),
      });
    });
  });
});
