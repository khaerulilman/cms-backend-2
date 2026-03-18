import { describe, it, expect } from "vitest";

import { ERROR_MESSAGES } from "../../constants/http.js";
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TableNotFoundError,
} from "../errors.js";

describe("Error Classes", () => {
  describe("AppError", () => {
    it("should create error with custom message and status code", () => {
      const error = new AppError("Custom error", 500);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Custom error");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("AppError");
    });

    it("should default to status code 500", () => {
      const error = new AppError("Server error");

      expect(error.statusCode).toBe(500);
    });

    it("should capture stack trace", () => {
      const error = new AppError("Test error", 500);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("AppError");
    });

    it("should be throwable", () => {
      expect(() => {
        throw new AppError("Test throw", 400);
      }).toThrow("Test throw");
    });
  });

  describe("ValidationError", () => {
    it("should create error with default message", () => {
      const error = new ValidationError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(ERROR_MESSAGES.VALIDATION_ERROR);
      expect(error.statusCode).toBe(422);
      expect(error.name).toBe("ValidationError");
    });

    it("should create error with custom message", () => {
      const error = new ValidationError("Invalid input");

      expect(error.message).toBe("Invalid input");
      expect(error.statusCode).toBe(422);
    });
  });

  describe("AuthenticationError", () => {
    it("should create error with default message", () => {
      const error = new AuthenticationError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe("AuthenticationError");
    });

    it("should create error with custom message", () => {
      const error = new AuthenticationError("Token expired");

      expect(error.message).toBe("Token expired");
      expect(error.statusCode).toBe(401);
    });
  });

  describe("AuthorizationError", () => {
    it("should create error with default message", () => {
      const error = new AuthorizationError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(ERROR_MESSAGES.FORBIDDEN);
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe("AuthorizationError");
    });

    it("should create error with custom message", () => {
      const error = new AuthorizationError("Access denied");

      expect(error.message).toBe("Access denied");
      expect(error.statusCode).toBe(403);
    });
  });

  describe("NotFoundError", () => {
    it("should create error with default message", () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(ERROR_MESSAGES.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("NotFoundError");
    });

    it("should create error with custom message", () => {
      const error = new NotFoundError("User not found");

      expect(error.message).toBe("User not found");
      expect(error.statusCode).toBe(404);
    });
  });

  describe("ConflictError", () => {
    it("should create error with default message", () => {
      const error = new ConflictError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(ERROR_MESSAGES.USER_ALREADY_EXISTS);
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe("ConflictError");
    });

    it("should create error with custom message", () => {
      const error = new ConflictError("Email already registered");

      expect(error.message).toBe("Email already registered");
      expect(error.statusCode).toBe(409);
    });
  });

  describe("TableNotFoundError", () => {
    it("should create error with default message", () => {
      const error = new TableNotFoundError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(ERROR_MESSAGES.NOT_FOUND);
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("TableNotFoundError");
    });

    it("should create error with custom message", () => {
      const error = new TableNotFoundError("Table does not exist");

      expect(error.message).toBe("Table does not exist");
      expect(error.statusCode).toBe(500);
    });
  });

  describe("Error inheritance", () => {
    it("all custom errors should be instances of Error", () => {
      const errors = [
        new AppError("test"),
        new ValidationError(),
        new AuthenticationError(),
        new AuthorizationError(),
        new NotFoundError(),
        new ConflictError(),
        new TableNotFoundError(),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error);
      });
    });

    it("all custom errors should be instances of AppError", () => {
      const errors = [
        new ValidationError(),
        new AuthenticationError(),
        new AuthorizationError(),
        new NotFoundError(),
        new ConflictError(),
        new TableNotFoundError(),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(AppError);
      });
    });
  });
});
