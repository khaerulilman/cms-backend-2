import { describe, it, expect } from 'vitest';

import { ERROR_MESSAGES } from '../../../constants/http.js';
import { apiKeyValidationSchemas } from '../apikey.validation.js';

describe('API Key Validation Schemas', () => {
  describe('deleteApiKey schema', () => {
    describe('valid input', () => {
      it('should validate with valid UUID v4', () => {
        const validData = {
          apiKeyId: '550e8400-e29b-41d4-a716-446655440000',
        };

        const { error, value } =
          apiKeyValidationSchemas.deleteApiKey.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          apiKeyId: '550e8400-e29b-41d4-a716-446655440000',
        });
      });

      it('should validate with another valid UUID v4', () => {
        const validData = {
          apiKeyId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        };

        const { error, value } =
          apiKeyValidationSchemas.deleteApiKey.validate(validData);

        expect(error).toBeUndefined();
        expect(value.apiKeyId).toBe('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
      });

      it('should validate with uppercase UUID', () => {
        const validData = {
          apiKeyId: '550E8400-E29B-41D4-A716-446655440000',
        };

        const { error, value } =
          apiKeyValidationSchemas.deleteApiKey.validate(validData);

        expect(error).toBeUndefined();
        expect(value.apiKeyId).toBe('550E8400-E29B-41D4-A716-446655440000');
      });
    });

    describe('invalid apiKeyId', () => {
      it('should fail when apiKeyId is missing', () => {
        const invalidData = {};

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.API_KEY_ID_REQUIRED,
        );
      });

      it('should fail when apiKeyId is empty string', () => {
        const invalidData = {
          apiKeyId: '',
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.API_KEY_ID_REQUIRED,
        );
      });

      it('should fail when apiKeyId is only whitespace', () => {
        const invalidData = {
          apiKeyId: '   ',
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.API_KEY_ID_INVALID,
        );
      });

      it('should fail when apiKeyId is not a valid UUID format', () => {
        const invalidData = {
          apiKeyId: 'not-a-uuid',
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.API_KEY_ID_INVALID,
        );
      });

      it('should fail when apiKeyId is a number', () => {
        const invalidData = {
          apiKeyId: 12345,
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('"apiKeyId" must be a string');
      });

      it('should fail when apiKeyId is null', () => {
        const invalidData = {
          apiKeyId: null,
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('"apiKeyId" must be a string');
      });

      it('should fail when apiKeyId is undefined', () => {
        const invalidData = {
          apiKeyId: undefined,
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.API_KEY_ID_REQUIRED,
        );
      });

      it('should fail when apiKeyId has invalid UUID format (too short)', () => {
        const invalidData = {
          apiKeyId: '550e8400-e29b-41d4-a716',
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.API_KEY_ID_INVALID,
        );
      });

      it('should fail when apiKeyId has invalid UUID format (wrong separators)', () => {
        const invalidData = {
          apiKeyId: '550e8400_e29b_41d4_a716_446655440000',
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.API_KEY_ID_INVALID,
        );
      });

      it('should fail when apiKeyId contains invalid characters', () => {
        const invalidData = {
          apiKeyId: '550e8400-e29b-41d4-a716-44665544000g',
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.API_KEY_ID_INVALID,
        );
      });
    });

    describe('edge cases', () => {
      it('should fail when apiKeyId is an array', () => {
        const invalidData = {
          apiKeyId: ['550e8400-e29b-41d4-a716-446655440000'],
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('"apiKeyId" must be a string');
      });

      it('should fail when apiKeyId is an object', () => {
        const invalidData = {
          apiKeyId: { id: '550e8400-e29b-41d4-a716-446655440000' },
        };

        const { error } =
          apiKeyValidationSchemas.deleteApiKey.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe('"apiKeyId" must be a string');
      });
    });
  });
});
