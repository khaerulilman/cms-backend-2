import { describe, it, expect } from 'vitest';

import { ERROR_MESSAGES } from '../../../constants/http.js';
import { columnValidationSchemas } from '../column.validation.js';

describe('Column Validation Schemas', () => {
  describe('createColumns schema', () => {
    describe('valid input', () => {
      it('should validate with valid tableId and columns', () => {
        const validData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: [{ name: 'Column 1' }, { name: 'Column 2' }],
        };

        const { error, value } =
          columnValidationSchemas.createColumns.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: [{ name: 'Column 1' }, { name: 'Column 2' }],
        });
      });

      it('should validate with single column', () => {
        const validData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: [{ name: 'Single Column' }],
        };

        const { error, value } =
          columnValidationSchemas.createColumns.validate(validData);

        expect(error).toBeUndefined();
        expect(value.columns).toHaveLength(1);
      });

      it('should trim column names', () => {
        const dataWithSpaces = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: [{ name: '  Column Name  ' }],
        };

        const { error, value } =
          columnValidationSchemas.createColumns.validate(dataWithSpaces);

        expect(error).toBeUndefined();
        expect(value.columns[0].name).toBe('Column Name');
      });

      it('should validate column name at max length (255 characters)', () => {
        const maxLengthName = 'a'.repeat(255);
        const validData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: [{ name: maxLengthName }],
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid tableId', () => {
      it('should fail when tableId is missing', () => {
        const invalidData = {
          columns: [{ name: 'Column 1' }],
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.TABLE_ID_REQUIRED);
      });

      it('should fail when tableId is empty string', () => {
        const invalidData = {
          tableId: '',
          columns: [{ name: 'Column 1' }],
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.TABLE_ID_REQUIRED);
      });

      it('should fail when tableId is not a valid UUID', () => {
        const invalidData = {
          tableId: 'not-a-uuid',
          columns: [{ name: 'Column 1' }],
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_TABLE_ID);
      });

      it('should fail when tableId is invalid UUID format (missing parts)', () => {
        const invalidData = {
          tableId: '123e4567-e89b-12d3-a456',
          columns: [{ name: 'Column 1' }],
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_TABLE_ID);
      });
    });

    describe('invalid columns', () => {
      it('should fail when columns is missing', () => {
        const invalidData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.COLUMNS_REQUIRED);
      });

      it('should fail when columns is empty array', () => {
        const invalidData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: [],
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.COLUMNS_EMPTY);
      });

      it('should fail when columns is not an array', () => {
        const invalidData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: 'not-an-array',
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.COLUMNS_REQUIRED);
      });

      it('should fail when column name is missing', () => {
        const invalidData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: [{}],
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.COLUMN_NAME_REQUIRED,
        );
      });

      it('should fail when column name is empty string', () => {
        const invalidData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: [{ name: '' }],
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.COLUMN_NAME_REQUIRED,
        );
      });

      it('should fail when column name exceeds 255 characters', () => {
        const longName = 'a'.repeat(256);
        const invalidData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: [{ name: longName }],
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.COLUMN_NAME_TOO_LONG,
        );
      });

      it('should fail when one of multiple columns has invalid name', () => {
        const invalidData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
          columns: [{ name: 'Valid Column' }, { name: '' }],
        };

        const { error } =
          columnValidationSchemas.createColumns.validate(invalidData);

        expect(error).toBeDefined();
      });
    });
  });

  describe('updateColumn schema', () => {
    describe('valid input', () => {
      it('should validate with valid column name', () => {
        const validData = {
          name: 'Updated Column Name',
        };

        const { error, value } =
          columnValidationSchemas.updateColumn.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          name: 'Updated Column Name',
        });
      });

      it('should trim column name', () => {
        const dataWithSpaces = {
          name: '  Updated Column Name  ',
        };

        const { error, value } =
          columnValidationSchemas.updateColumn.validate(dataWithSpaces);

        expect(error).toBeUndefined();
        expect(value.name).toBe('Updated Column Name');
      });

      it('should validate column name at max length (255 characters)', () => {
        const maxLengthName = 'a'.repeat(255);
        const validData = {
          name: maxLengthName,
        };

        const { error } =
          columnValidationSchemas.updateColumn.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate single character column name', () => {
        const validData = {
          name: 'A',
        };

        const { error } =
          columnValidationSchemas.updateColumn.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid input', () => {
      it('should fail when name is missing', () => {
        const invalidData = {};

        const { error } =
          columnValidationSchemas.updateColumn.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.COLUMN_NAME_REQUIRED,
        );
      });

      it('should fail when name is empty string', () => {
        const invalidData = {
          name: '',
        };

        const { error } =
          columnValidationSchemas.updateColumn.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.COLUMN_NAME_EMPTY);
      });

      it('should fail when name is only whitespace', () => {
        const invalidData = {
          name: '   ',
        };

        const { error } =
          columnValidationSchemas.updateColumn.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.COLUMN_NAME_EMPTY);
      });

      it('should fail when name exceeds 255 characters', () => {
        const longName = 'a'.repeat(256);
        const invalidData = {
          name: longName,
        };

        const { error } =
          columnValidationSchemas.updateColumn.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(
          ERROR_MESSAGES.COLUMN_NAME_TOO_LONG,
        );
      });

      it('should fail when name is not a string', () => {
        const invalidData = {
          name: 123,
        };

        const { error } =
          columnValidationSchemas.updateColumn.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when name is null', () => {
        const invalidData = {
          name: null,
        };

        const { error } =
          columnValidationSchemas.updateColumn.validate(invalidData);

        expect(error).toBeDefined();
      });
    });
  });
});
