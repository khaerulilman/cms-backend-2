import { describe, it, expect, beforeEach, vi } from "vitest";

import { HTTP_STATUS, ERROR_MESSAGES } from "../../constants/http.js";
import * as ErrorClasses from "../../utils/errors.js";
import { errorMiddleware } from "../error.middleware.js";

// Mock logger to prevent noise in test output
vi.mock("../../utils/logger.js", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Sentry to prevent external calls during tests
vi.mock("../../config/sentry.js", () => ({
  captureError: vi.fn(),
}));

describe("Error Middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false,
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  describe("Custom Error Classes", () => {
    it("should handle AppError with custom status and message", () => {
      const error = new ErrorClasses.AppError(
        "Custom error message",
        HTTP_STATUS.CONFLICT,
      );

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Custom error message",
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle NotFoundError", () => {
      const error = new ErrorClasses.NotFoundError("Resource not found");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Resource not found",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle ValidationError", () => {
      const error = new ErrorClasses.ValidationError("Validation failed");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle AuthenticationError", () => {
      const error = new ErrorClasses.AuthenticationError("Unauthorized access");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized access",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle ConflictError", () => {
      const error = new ErrorClasses.ConflictError("Resource already exists");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Resource already exists",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle AuthenticationError", () => {
      const error = new ErrorClasses.AuthenticationError(
        "Authentication failed",
      );

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Authentication failed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("JWT Errors", () => {
    it("should handle JsonWebTokenError", () => {
      const error = new Error("Invalid token");
      error.name = "JsonWebTokenError";

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle TokenExpiredError", () => {
      const error = new Error("Token expired");
      error.name = "TokenExpiredError";

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Generic Errors", () => {
    it("should handle ValidationError by name", () => {
      const error = new Error("Validation error occurred");
      error.name = "ValidationError";

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error occurred",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle generic Error with message", () => {
      const error = new Error("Something went wrong");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should use default error message for errors without message", () => {
      const error = {};

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Error Details", () => {
    it("should include details in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new ErrorClasses.ValidationError("Validation failed");
      error.details = { field: "email", reason: "invalid format" };

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
        details: { field: "email", reason: "invalid format" },
      });

      process.env.NODE_ENV = originalEnv;
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should not include details in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new ErrorClasses.ValidationError("Validation failed");
      error.details = { field: "email", reason: "invalid format" };

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
      });

      const call = mockRes.json.mock.calls[0][0];
      expect(call.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should not include details when not provided", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new ErrorClasses.ValidationError("Validation failed");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
      });

      const call = mockRes.json.mock.calls[0][0];
      expect(call.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Response Already Sent", () => {
    it("should call next if headers already sent", () => {
      mockRes.headersSent = true;
      const error = new Error("Test error");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should not call next if headers not sent", () => {
      mockRes.headersSent = false;
      const error = new Error("Test error");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe("Response Format", () => {
    it("should always return success: false", () => {
      const error = new Error("Test error");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      const call = mockRes.json.mock.calls[0][0];
      expect(call.success).toBe(false);
    });

    it("should always include message in response", () => {
      const error = new ErrorClasses.NotFoundError("Resource not found");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      const call = mockRes.json.mock.calls[0][0];
      expect(call).toHaveProperty("message");
      expect(call.message).toBe("Resource not found");
    });

    it("should return JSON response", () => {
      const error = new Error("Test error");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("Status Code Priority", () => {
    it("should prioritize custom error status codes", () => {
      const error = new ErrorClasses.AppError("Custom", 418); // I'm a teapot

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(418);
    });

    it("should use 500 for unknown errors", () => {
      const error = new Error("Unknown error");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle error with empty message", () => {
      const error = new Error("");

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });

    it("should handle error without message property", () => {
      const error = { name: "CustomError" };

      errorMiddleware(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });
});
