import { ERROR_MESSAGES } from '../constants/http.js';

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = ERROR_MESSAGES.VALIDATION_ERROR) {
    super(message, 422);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = ERROR_MESSAGES.FORBIDDEN) {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = ERROR_MESSAGES.NOT_FOUND) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = ERROR_MESSAGES.USER_ALREADY_EXISTS) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class TableNotFoundError extends AppError {
  constructor(message = ERROR_MESSAGES.NOT_FOUND) {
    super(message, 500);
    this.name = 'TableNotFoundError';
  }
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TableNotFoundError,
};
