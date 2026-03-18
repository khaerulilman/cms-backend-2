import { describe, it, expect } from 'vitest';

import { ERROR_MESSAGES } from '../../../constants/http.js';
import { authValidationSchemas } from '../auth.validation.js';

describe('Auth Validation Schemas', () => {
  describe('register schema', () => {
    describe('valid input', () => {
      it('should validate with all valid fields', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
        };

        const { error, value } =
          authValidationSchemas.register.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
        });
      });

      it('should trim and lowercase email', () => {
        const validData = {
          email: '  TEST@EXAMPLE.COM  ',
          password: 'password123',
          name: 'John Doe',
        };

        const { error, value } =
          authValidationSchemas.register.validate(validData);

        expect(error).toBeUndefined();
        expect(value.email).toBe('test@example.com');
      });

      it('should trim name', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
          name: '  John Doe  ',
        };

        const { error, value } =
          authValidationSchemas.register.validate(validData);

        expect(error).toBeUndefined();
        expect(value.name).toBe('John Doe');
      });

      it('should validate with minimum name length (2 characters)', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Jo',
        };

        const { error } = authValidationSchemas.register.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with maximum name length (100 characters)', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
          name: 'a'.repeat(100),
        };

        const { error } = authValidationSchemas.register.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with minimum password length (8 characters)', () => {
        const validData = {
          email: 'test@example.com',
          password: '12345678',
          name: 'John Doe',
        };

        const { error } = authValidationSchemas.register.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid email', () => {
      it('should fail when email is missing', () => {
        const invalidData = {
          password: 'password123',
          name: 'John Doe',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_REQUIRED);
      });

      it('should fail when email is empty string', () => {
        const invalidData = {
          email: '',
          password: 'password123',
          name: 'John Doe',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_REQUIRED);
      });

      it('should fail when email format is invalid', () => {
        const invalidData = {
          email: 'invalid-email',
          password: 'password123',
          name: 'John Doe',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_INVALID);
      });

      it('should fail when email has no domain', () => {
        const invalidData = {
          email: 'test@',
          password: 'password123',
          name: 'John Doe',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_INVALID);
      });

      it('should fail when email has no @ symbol', () => {
        const invalidData = {
          email: 'testexample.com',
          password: 'password123',
          name: 'John Doe',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_INVALID);
      });
    });

    describe('invalid password', () => {
      it('should fail when password is missing', () => {
        const invalidData = {
          email: 'test@example.com',
          name: 'John Doe',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.PASSWORD_REQUIRED);
      });

      it('should fail when password is empty string', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '',
          name: 'John Doe',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.PASSWORD_REQUIRED);
      });

      it('should fail when password is less than 8 characters', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '1234567',
          name: 'John Doe',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.PASSWORD_WEAK);
      });

      it('should fail when password is 1 character', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'a',
          name: 'John Doe',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.PASSWORD_WEAK);
      });
    });

    describe('invalid name', () => {
      it('should fail when name is missing', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.NAME_REQUIRED);
      });

      it('should fail when name is empty string', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'password123',
          name: '',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.NAME_REQUIRED);
      });

      it('should fail when name is less than 2 characters', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'password123',
          name: 'J',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.NAME_TOO_SHORT);
      });

      it('should fail when name exceeds 100 characters', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'password123',
          name: 'a'.repeat(101),
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.NAME_TOO_LONG);
      });
    });

    describe('multiple invalid fields', () => {
      it('should return first validation error when all fields are missing', () => {
        const invalidData = {};

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_REQUIRED);
      });

      it('should return first validation error when all fields are invalid', () => {
        const invalidData = {
          email: 'invalid-email',
          password: '123',
          name: 'J',
        };

        const { error } = authValidationSchemas.register.validate(invalidData);

        expect(error).toBeDefined();
        // First error should be about email format
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_INVALID);
      });
    });
  });

  describe('login schema', () => {
    describe('valid input', () => {
      it('should validate with all valid fields', () => {
        const validData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const { error, value } =
          authValidationSchemas.login.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      it('should trim and lowercase email', () => {
        const validData = {
          email: '  TEST@EXAMPLE.COM  ',
          password: 'password123',
        };

        const { error, value } =
          authValidationSchemas.login.validate(validData);

        expect(error).toBeUndefined();
        expect(value.email).toBe('test@example.com');
      });

      it('should accept any password length (no minimum)', () => {
        const validData = {
          email: 'test@example.com',
          password: '123',
        };

        const { error } = authValidationSchemas.login.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid email', () => {
      it('should fail when email is missing', () => {
        const invalidData = {
          password: 'password123',
        };

        const { error } = authValidationSchemas.login.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_REQUIRED);
      });

      it('should fail when email is empty string', () => {
        const invalidData = {
          email: '',
          password: 'password123',
        };

        const { error } = authValidationSchemas.login.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_REQUIRED);
      });

      it('should fail when email format is invalid', () => {
        const invalidData = {
          email: 'invalid-email',
          password: 'password123',
        };

        const { error } = authValidationSchemas.login.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_INVALID);
      });

      it('should fail when email has no domain extension', () => {
        const invalidData = {
          email: 'test@example',
          password: 'password123',
        };

        const { error } = authValidationSchemas.login.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_INVALID);
      });
    });

    describe('invalid password', () => {
      it('should fail when password is missing', () => {
        const invalidData = {
          email: 'test@example.com',
        };

        const { error } = authValidationSchemas.login.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.PASSWORD_REQUIRED);
      });

      it('should fail when password is empty string', () => {
        const invalidData = {
          email: 'test@example.com',
          password: '',
        };

        const { error } = authValidationSchemas.login.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.PASSWORD_REQUIRED);
      });
    });

    describe('multiple invalid fields', () => {
      it('should return first validation error when all fields are missing', () => {
        const invalidData = {};

        const { error } = authValidationSchemas.login.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_REQUIRED);
      });

      it('should return first validation error when all fields are invalid', () => {
        const invalidData = {
          email: 'invalid-email',
          password: '',
        };

        const { error } = authValidationSchemas.login.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.EMAIL_INVALID);
      });
    });
  });

  describe('refreshToken schema', () => {
    describe('valid input', () => {
      it('should validate with valid refresh token', () => {
        const validData = {
          refreshToken: 'valid-refresh-token-12345',
        };

        const { error, value } =
          authValidationSchemas.refreshToken.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          refreshToken: 'valid-refresh-token-12345',
        });
      });

      it('should trim refresh token', () => {
        const validData = {
          refreshToken: '  valid-refresh-token-12345  ',
        };

        const { error, value } =
          authValidationSchemas.refreshToken.validate(validData);

        expect(error).toBeUndefined();
        expect(value.refreshToken).toBe('valid-refresh-token-12345');
      });

      it('should accept long refresh token strings', () => {
        const validData = {
          refreshToken: 'a'.repeat(500),
        };

        const { error } =
          authValidationSchemas.refreshToken.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid refresh token', () => {
      it('should fail when refreshToken is missing', () => {
        const invalidData = {};

        const { error } =
          authValidationSchemas.refreshToken.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
        );
      });

      it('should fail when refreshToken is empty string', () => {
        const invalidData = {
          refreshToken: '',
        };

        const { error } =
          authValidationSchemas.refreshToken.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
        );
      });

      it('should fail when refreshToken is only whitespace', () => {
        const invalidData = {
          refreshToken: '   ',
        };

        const { error } =
          authValidationSchemas.refreshToken.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
        );
      });
    });
  });
});
