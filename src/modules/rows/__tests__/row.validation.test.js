import { describe, it, expect } from 'vitest';

import { ERROR_MESSAGES } from '../../../constants/http.js';
import { rowValidationSchemas } from '../row.validation.js';

describe('Row Validation Schemas', () => {
  describe('createRow schema', () => {
    describe('valid input', () => {
      it('should validate with valid tableId', () => {
        const validData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
        };

        const { error, value } =
          rowValidationSchemas.createRow.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          tableId: '123e4567-e89b-12d3-a456-426614174000',
        });
      });

      it('should validate with different valid UUID formats', () => {
        const validData = {
          tableId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        };

        const { error } = rowValidationSchemas.createRow.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid tableId', () => {
      it('should fail when tableId is missing', () => {
        const invalidData = {};

        const { error } = rowValidationSchemas.createRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.TABLE_ID_REQUIRED);
      });

      it('should fail when tableId is empty string', () => {
        const invalidData = {
          tableId: '',
        };

        const { error } = rowValidationSchemas.createRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.TABLE_ID_REQUIRED);
      });

      it('should fail when tableId is not a valid UUID', () => {
        const invalidData = {
          tableId: 'not-a-uuid',
        };

        const { error } = rowValidationSchemas.createRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_TABLE_ID);
      });

      it('should fail when tableId is invalid UUID format (missing parts)', () => {
        const invalidData = {
          tableId: '123e4567-e89b-12d3-a456',
        };

        const { error } = rowValidationSchemas.createRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_TABLE_ID);
      });

      it('should fail when tableId is numeric value', () => {
        const invalidData = {
          tableId: 123456,
        };

        const { error } = rowValidationSchemas.createRow.validate(invalidData);

        expect(error).toBeDefined();
      });
    });
  });

  describe('getRowsByTable schema', () => {
    describe('valid input', () => {
      it('should validate with valid tableId', () => {
        const validData = {
          tableId: '123e4567-e89b-12d3-a456-426614174000',
        };

        const { error, value } =
          rowValidationSchemas.getRowsByTable.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          tableId: '123e4567-e89b-12d3-a456-426614174000',
        });
      });
    });

    describe('invalid tableId', () => {
      it('should fail when tableId is missing', () => {
        const invalidData = {};

        const { error } =
          rowValidationSchemas.getRowsByTable.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.TABLE_ID_REQUIRED);
      });

      it('should fail when tableId is not a valid UUID', () => {
        const invalidData = {
          tableId: 'invalid-uuid',
        };

        const { error } =
          rowValidationSchemas.getRowsByTable.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_TABLE_ID);
      });
    });
  });

  describe('getRowById schema', () => {
    describe('valid input', () => {
      it('should validate with valid rowId', () => {
        const validData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
        };

        const { error, value } =
          rowValidationSchemas.getRowById.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          rowId: '123e4567-e89b-12d3-a456-426614174000',
        });
      });

      it('should validate with different valid UUID formats', () => {
        const validData = {
          rowId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        };

        const { error } = rowValidationSchemas.getRowById.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid rowId', () => {
      it('should fail when rowId is missing', () => {
        const invalidData = {};

        const { error } = rowValidationSchemas.getRowById.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });

      it('should fail when rowId is empty string', () => {
        const invalidData = {
          rowId: '',
        };

        const { error } = rowValidationSchemas.getRowById.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });

      it('should fail when rowId is not a valid UUID', () => {
        const invalidData = {
          rowId: 'not-a-uuid',
        };

        const { error } = rowValidationSchemas.getRowById.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_ROW_ID);
      });

      it('should fail when rowId is invalid UUID format (missing parts)', () => {
        const invalidData = {
          rowId: '123e4567-e89b-12d3-a456',
        };

        const { error } = rowValidationSchemas.getRowById.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_ROW_ID);
      });

      it('should fail when rowId is numeric value', () => {
        const invalidData = {
          rowId: 123456,
        };

        const { error } = rowValidationSchemas.getRowById.validate(invalidData);

        expect(error).toBeDefined();
      });
    });
  });

  describe('updateRow schema', () => {
    describe('valid input', () => {
      it('should validate with valid rowId', () => {
        const validData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
        };

        const { error, value } =
          rowValidationSchemas.updateRow.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          rowId: '123e4567-e89b-12d3-a456-426614174000',
        });
      });
    });

    describe('invalid rowId', () => {
      it('should fail when rowId is missing', () => {
        const invalidData = {};

        const { error } = rowValidationSchemas.updateRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });

      it('should fail when rowId is empty string', () => {
        const invalidData = {
          rowId: '',
        };

        const { error } = rowValidationSchemas.updateRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });

      it('should fail when rowId is not a valid UUID', () => {
        const invalidData = {
          rowId: 'invalid-uuid',
        };

        const { error } = rowValidationSchemas.updateRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_ROW_ID);
      });
    });
  });

  describe('deleteRow schema', () => {
    describe('valid input', () => {
      it('should validate with valid rowId', () => {
        const validData = {
          rowId: '123e4567-e89b-12d3-a456-426614174000',
        };

        const { error, value } =
          rowValidationSchemas.deleteRow.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          rowId: '123e4567-e89b-12d3-a456-426614174000',
        });
      });
    });

    describe('invalid rowId', () => {
      it('should fail when rowId is missing', () => {
        const invalidData = {};

        const { error } = rowValidationSchemas.deleteRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });

      it('should fail when rowId is empty string', () => {
        const invalidData = {
          rowId: '',
        };

        const { error } = rowValidationSchemas.deleteRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.ROW_ID_REQUIRED);
      });

      it('should fail when rowId is not a valid UUID', () => {
        const invalidData = {
          rowId: 'not-valid-uuid',
        };

        const { error } = rowValidationSchemas.deleteRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_ROW_ID);
      });

      it('should fail when rowId is invalid UUID format (missing parts)', () => {
        const invalidData = {
          rowId: '123e4567-e89b-12d3',
        };

        const { error } = rowValidationSchemas.deleteRow.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toBe(ERROR_MESSAGES.INVALID_ROW_ID);
      });

      it('should fail when rowId is numeric value', () => {
        const invalidData = {
          rowId: 12345,
        };

        const { error } = rowValidationSchemas.deleteRow.validate(invalidData);

        expect(error).toBeDefined();
      });
    });
  });
});
