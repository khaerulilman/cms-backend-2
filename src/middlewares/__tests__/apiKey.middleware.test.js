import { describe, it, expect, beforeEach, vi } from "vitest";

import prisma from "../../prisma/client.js";
import { apiKeyMiddleware } from "../apiKey.middleware.js";

// Mock logger to prevent noise in test output
vi.mock("../../utils/logger.js", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock prisma client
vi.mock("../../prisma/client.js", () => ({
  default: {
    apiKey: {
      findUnique: vi.fn(),
    },
  },
}));

describe("API Key Middleware", () => {
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

  describe("Valid API Key", () => {
    it("should allow request with valid API key", async () => {
      const mockApiKeyRecord = {
        id: "apikey-123",
        apiKey: "sk_valid_api_key_12345",
        userId: "user-123",
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
        },
      };

      mockReq.headers["x-api-key"] = "sk_valid_api_key_12345";
      prisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord);

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { apiKey: "sk_valid_api_key_12345" },
        include: {
          user: true,
        },
      });
      expect(prisma.apiKey.findUnique).toHaveBeenCalledTimes(1);
      expect(mockReq.user).toEqual({
        id: "user-123",
        email: "test@example.com",
      });
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should attach user info to request object", async () => {
      const mockApiKeyRecord = {
        id: "apikey-456",
        apiKey: "sk_another_key",
        userId: "user-456",
        user: {
          id: "user-456",
          email: "another@example.com",
          name: "Another User",
        },
      };

      mockReq.headers["x-api-key"] = "sk_another_key";
      prisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord);

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe("user-456");
      expect(mockReq.user.email).toBe("another@example.com");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("Missing API Key", () => {
    it("should return 401 when API key header is missing", async () => {
      mockReq.headers = {}; // No x-api-key header

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "API key is required",
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
      expect(prisma.apiKey.findUnique).not.toHaveBeenCalled();
    });

    it("should return 401 when API key header is empty", async () => {
      mockReq.headers["x-api-key"] = "";

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "API key is required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when API key header is null", async () => {
      mockReq.headers["x-api-key"] = null;

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "API key is required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when API key header is undefined", async () => {
      mockReq.headers["x-api-key"] = undefined;

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "API key is required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Invalid API Key", () => {
    it("should return 401 when API key is not found in database", async () => {
      mockReq.headers["x-api-key"] = "sk_invalid_key";
      prisma.apiKey.findUnique.mockResolvedValue(null);

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { apiKey: "sk_invalid_key" },
        include: {
          user: true,
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid API key",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when API key record has no user", async () => {
      const mockApiKeyRecord = {
        id: "apikey-789",
        apiKey: "sk_orphaned_key",
        userId: "user-999",
        user: null, // User not found
      };

      mockReq.headers["x-api-key"] = "sk_orphaned_key";
      prisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord);

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid API key",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when API key record has undefined user", async () => {
      const mockApiKeyRecord = {
        id: "apikey-789",
        apiKey: "sk_orphaned_key",
        userId: "user-999",
        user: undefined,
      };

      mockReq.headers["x-api-key"] = "sk_orphaned_key";
      prisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord);

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid API key",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Database Errors", () => {
    it("should return 500 when database query fails", async () => {
      mockReq.headers["x-api-key"] = "sk_valid_key";
      prisma.apiKey.findUnique.mockRejectedValue(
        new Error("Database connection error"),
      );

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { apiKey: "sk_valid_key" },
        include: {
          user: true,
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "API key validation failed",
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors gracefully", async () => {
      mockReq.headers["x-api-key"] = "sk_valid_key";
      prisma.apiKey.findUnique.mockRejectedValue(new Error("Unexpected error"));

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "API key validation failed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle timeout errors", async () => {
      mockReq.headers["x-api-key"] = "sk_valid_key";
      const timeoutError = new Error("Query timeout");
      timeoutError.code = "ETIMEDOUT";
      prisma.apiKey.findUnique.mockRejectedValue(timeoutError);

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "API key validation failed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle API key with special characters", async () => {
      const mockApiKeyRecord = {
        id: "apikey-special",
        apiKey: "sk_key-with_special.chars@123",
        userId: "user-123",
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      };

      mockReq.headers["x-api-key"] = "sk_key-with_special.chars@123";
      prisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord);

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { apiKey: "sk_key-with_special.chars@123" },
        include: {
          user: true,
        },
      });
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should handle very long API keys", async () => {
      const longApiKey = "sk_" + "a".repeat(100);
      const mockApiKeyRecord = {
        id: "apikey-long",
        apiKey: longApiKey,
        userId: "user-123",
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      };

      mockReq.headers["x-api-key"] = longApiKey;
      prisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord);

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should only attach id and email to req.user, not full user object", async () => {
      const mockApiKeyRecord = {
        id: "apikey-123",
        apiKey: "sk_valid_key",
        userId: "user-123",
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          password: "hashed_password",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockReq.headers["x-api-key"] = "sk_valid_key";
      prisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord);

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual({
        id: "user-123",
        email: "test@example.com",
      });
      expect(mockReq.user.name).toBeUndefined();
      expect(mockReq.user.password).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should handle case-sensitive header names", async () => {
      const mockApiKeyRecord = {
        id: "apikey-123",
        apiKey: "sk_valid_key",
        userId: "user-123",
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      };

      // Headers are case-insensitive in HTTP, but we're testing the exact key
      mockReq.headers["X-API-KEY"] = "sk_valid_key";
      prisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord);

      // This should fail because Express normalizes to lowercase
      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "API key is required",
      });
    });
  });

  describe("Response Format", () => {
    it("should always return JSON response with success field", async () => {
      mockReq.headers["x-api-key"] = "sk_invalid_key";
      prisma.apiKey.findUnique.mockResolvedValue(null);

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      const call = mockRes.json.mock.calls[0][0];
      expect(call).toHaveProperty("success");
      expect(call).toHaveProperty("message");
      expect(call.success).toBe(false);
    });

    it("should use consistent error response format", async () => {
      mockReq.headers = {};

      await apiKeyMiddleware(mockReq, mockRes, mockNext);

      const call = mockRes.json.mock.calls[0][0];
      expect(call).toEqual({
        success: false,
        message: expect.any(String),
      });
    });
  });
});
