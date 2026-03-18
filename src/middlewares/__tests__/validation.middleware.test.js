import Joi from 'joi';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { HTTP_STATUS, ERROR_MESSAGES } from '../../constants/http.js';
import { validateRequest } from '../validation.middleware.js';

describe('Validation Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  describe('validateRequest', () => {
    it('should pass validation with valid data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      });

      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should replace req.body with validated value', () => {
      const schema = Joi.object({
        name: Joi.string().required().trim(),
        email: Joi.string().email().required(),
      });

      mockReq.body = {
        name: '  John Doe  ',
        email: 'john@example.com',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockReq.body.name).toBe('John Doe');
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should strip unknown fields from request body', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockReq.body = {
        name: 'John Doe',
        unknownField: 'should be removed',
        anotherUnknown: 123,
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual({ name: 'John Doe' });
      expect(mockReq.body.unknownField).toBeUndefined();
      expect(mockReq.body.anotherUnknown).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for missing required fields', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      });

      mockReq.body = {
        name: 'John Doe',
        // email is missing
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: expect.arrayContaining([expect.stringContaining('email')]),
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
      });

      mockReq.body = {
        email: 'invalid-email',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: expect.arrayContaining([
          expect.stringContaining('valid email'),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return all validation errors when abortEarly is false', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().min(18).required(),
      });

      mockReq.body = {
        // all fields missing or invalid
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: expect.any(Array),
      });

      const call = mockRes.json.mock.calls[0][0];
      expect(call.errors.length).toBeGreaterThan(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate string length constraints', () => {
      const schema = Joi.object({
        name: Joi.string().min(3).max(10).required(),
      });

      mockReq.body = {
        name: 'AB',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: expect.arrayContaining([expect.stringContaining('length')]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate number constraints', () => {
      const schema = Joi.object({
        age: Joi.number().min(18).max(100).required(),
      });

      mockReq.body = {
        age: 15,
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: expect.any(Array),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate nested objects', () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
        }).required(),
      });

      mockReq.body = {
        user: {
          name: 'John',
          email: 'invalid-email',
        },
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: expect.any(Array),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate arrays', () => {
      const schema = Joi.object({
        tags: Joi.array().items(Joi.string()).min(1).required(),
      });

      mockReq.body = {
        tags: [],
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: expect.any(Array),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate UUID format', () => {
      const schema = Joi.object({
        id: Joi.string().uuid().required(),
      });

      mockReq.body = {
        id: 'not-a-uuid',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: expect.arrayContaining([expect.stringContaining('GUID')]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass validation with valid UUID', () => {
      const schema = Joi.object({
        id: Joi.string().uuid().required(),
      });

      mockReq.body = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should validate optional fields', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
      });

      mockReq.body = {
        name: 'Test',
        // description is optional and not provided
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should validate boolean fields', () => {
      const schema = Joi.object({
        isActive: Joi.boolean().required(),
      });

      mockReq.body = {
        isActive: 'not-a-boolean',
      };

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: expect.any(Array),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty request body', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });

      mockReq.body = {};

      const middleware = validateRequest(schema);
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: expect.any(Array),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
