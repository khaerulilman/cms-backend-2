import { describe, it, expect } from 'vitest';

import { ERROR_MESSAGES } from '../../../constants/http.js';
import { cellValidationSchemas } from '../cell.validation.js';

describe('Cell Validation Schemas', () => {
  describe('getCellsByRow schema', () => {
    describe('valid input', () => {
      it('should validate with valid UUID rowId', () => {
        const validData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
        };

        const { error, value } =
          cellValidationSchemas.getCellsByRow.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          rowId: '123e4567-e89b-12d3-a456-426614174000',
        });
      });

      it('should validate with different valid UUID formats', () => {
        const validData = {
          rowId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        };

        const { error } =
          cellValidationSchemas.getCellsByRow.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid rowId', () => {
      it('should fail when rowId is missing', () => {
        const invalidData = {};

        const { error } =
          cellValidationSchemas.getCellsByRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });

      it('should fail when rowId is empty string', () => {
        const invalidData = {
          rowId: '',
        };

        const { error } =
          cellValidationSchemas.getCellsByRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });

      it('should fail when rowId is not a valid UUID', () => {
        const invalidData = {
          rowId: 'not-a-uuid',
        };

        const { error } =
          cellValidationSchemas.getCellsByRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_ROW_ID);
      });

      it('should fail when rowId is invalid UUID format (missing parts)', () => {
        const invalidData = {
          rowId: '123e4567-e89b-12d3-a456',
        };

        const { error } =
          cellValidationSchemas.getCellsByRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_ROW_ID);
      });

      it('should fail when rowId is numeric value', () => {
        const invalidData = {
          rowId: 123456,
        };

        const { error } =
          cellValidationSchemas.getCellsByRow.validate(invalidData);

        expect(error).toBeDefined();
      });
    });
  });

  describe('upsertCell schema', () => {
    describe('valid input', () => {
      it('should validate with all required fields', () => {
        const validData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          value: 'cell content',
        };

        const { error, value } =
          cellValidationSchemas.upsertCell.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should validate with value as null', () => {
        const validData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          value: null,
        };

        const { error } = cellValidationSchemas.upsertCell.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with value as empty string', () => {
        const validData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          value: '',
        };

        const { error } = cellValidationSchemas.upsertCell.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate without value field (optional)', () => {
        const validData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        };

        const { error } = cellValidationSchemas.upsertCell.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with maximum length value (5000 characters)', () => {
        const validData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          value: 'a'.repeat(5000),
        };

        const { error } = cellValidationSchemas.upsertCell.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with various text content', () => {
        const validData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        };

        const { error } = cellValidationSchemas.upsertCell.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid rowId', () => {
      it('should fail when rowId is missing', () => {
        const invalidData = {
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          value: 'content',
        };

        const { error } =
          cellValidationSchemas.upsertCell.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });

      it('should fail when rowId is empty string', () => {
        const invalidData = {
          rowId: '',
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          value: 'content',
        };

        const { error } =
          cellValidationSchemas.upsertCell.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });

      it('should fail when rowId is not a valid UUID', () => {
        const invalidData = {
          rowId: 'invalid-id',
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          value: 'content',
        };

        const { error } =
          cellValidationSchemas.upsertCell.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_ROW_ID);
      });
    });

    describe('invalid columnId', () => {
      it('should fail when columnId is missing', () => {
        const invalidData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          value: 'content',
        };

        const { error } =
          cellValidationSchemas.upsertCell.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.COLUMN_ID_REQUIRED,
        );
      });

      it('should fail when columnId is empty string', () => {
        const invalidData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          columnId: '',
          value: 'content',
        };

        const { error } =
          cellValidationSchemas.upsertCell.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.COLUMN_ID_REQUIRED,
        );
      });

      it('should fail when columnId is not a valid UUID', () => {
        const invalidData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          columnId: 'not-a-uuid',
          value: 'content',
        };

        const { error } =
          cellValidationSchemas.upsertCell.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_COLUMN_ID);
      });
    });

    describe('invalid value', () => {
      it('should fail when value exceeds maximum length (5000 characters)', () => {
        const invalidData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          value: 'a'.repeat(5001),
        };

        const { error } =
          cellValidationSchemas.upsertCell.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.CELL_VALUE_TOO_LONG,
        );
      });

      it('should fail when value is very long (10000 characters)', () => {
        const invalidData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
          columnId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          value: 'a'.repeat(10000),
        };

        const { error } =
          cellValidationSchemas.upsertCell.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.CELL_VALUE_TOO_LONG,
        );
      });
    });

    describe('multiple invalid fields', () => {
      it('should return first validation error when multiple fields are invalid', () => {
        const invalidData = {
          rowId: 'invalid-row',
          columnId: 'invalid-column',
          value: 'a'.repeat(5001),
        };

        const { error } =
          cellValidationSchemas.upsertCell.validate(invalidData);

        expect(error).toBeDefined();
        // First error should be about rowId format
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_ROW_ID);
      });

      it('should return first validation error when all required fields are missing', () => {
        const invalidData = {};

        const { error } =
          cellValidationSchemas.upsertCell.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });
    });
  });
});
