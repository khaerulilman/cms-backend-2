import { describe, it, expect } from 'vitest';

import tableValidationSchemas from '../table.validation.js';

describe('Table Validation Schemas', () => {
  describe('createTable schema', () => {
    it('should validate valid create table data', () => {
      const validData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Table',
        isSubTable: false,
      };

      const { error, value } =
        tableValidationSchemas.createTable.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual({
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Table',
        isSubTable: false,
      });
    });

    it('should validate when isSubTable is omitted (optional)', () => {
      const validData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Table',
      };

      const { error, value } =
        tableValidationSchemas.createTable.validate(validData);

      expect(error).toBeUndefined();
      expect(value.projectId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(value.name).toBe('Test Table');
    });

    it('should trim the table name', () => {
      const dataWithSpaces = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: '  Test Table  ',
      };

      const { error, value } =
        tableValidationSchemas.createTable.validate(dataWithSpaces);

      expect(error).toBeUndefined();
      expect(value.name).toBe('Test Table');
    });

    it('should fail validation for missing projectId', () => {
      const invalidData = {
        name: 'Test Table',
      };

      const { error } =
        tableValidationSchemas.createTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['projectId']);
      expect(error.details[0].message).toContain('required');
    });

    it('should fail validation for empty projectId', () => {
      const invalidData = {
        projectId: '',
        name: 'Test Table',
      };

      const { error } =
        tableValidationSchemas.createTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['projectId']);
      expect(error.details[0].message).toBe('Project ID is required');
    });

    it('should fail validation for invalid UUID format in projectId', () => {
      const invalidData = {
        projectId: 'not-a-valid-uuid',
        name: 'Test Table',
      };

      const { error } =
        tableValidationSchemas.createTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['projectId']);
      expect(error.details[0].message).toBe('Project ID must be a valid UUID');
    });

    it('should fail validation for missing name', () => {
      const invalidData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const { error } =
        tableValidationSchemas.createTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['name']);
      expect(error.details[0].message).toBe('Table name is required');
    });

    it('should fail validation for empty name', () => {
      const invalidData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
      };

      const { error } =
        tableValidationSchemas.createTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['name']);
      expect(error.details[0].message).toBe('Table name is required');
    });

    it('should fail validation for name exceeding max length', () => {
      const invalidData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'a'.repeat(256), // 256 characters
      };

      const { error } =
        tableValidationSchemas.createTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['name']);
      expect(error.details[0].message).toBe(
        'Table name cannot exceed 255 characters',
      );
    });

    it('should accept name with exactly 255 characters', () => {
      const validData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'a'.repeat(255),
      };

      const { error } = tableValidationSchemas.createTable.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should fail validation for invalid isSubTable type', () => {
      const invalidData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Table',
        isSubTable: 'not-a-boolean',
      };

      const { error } =
        tableValidationSchemas.createTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['isSubTable']);
      expect(error.details[0].message).toBe('isSubTable must be a boolean');
    });

    it('should validate with isSubTable as true', () => {
      const validData = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Sub Table',
        isSubTable: true,
      };

      const { error, value } =
        tableValidationSchemas.createTable.validate(validData);

      expect(error).toBeUndefined();
      expect(value.isSubTable).toBe(true);
    });

    it('should return all validation errors when abortEarly is false', () => {
      const invalidData = {
        projectId: 'invalid-uuid',
        name: '',
        isSubTable: 'not-boolean',
      };

      const { error } = tableValidationSchemas.createTable.validate(
        invalidData,
        { abortEarly: false },
      );

      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThan(1);
      expect(error.details.map((d) => d.path[0])).toContain('projectId');
      expect(error.details.map((d) => d.path[0])).toContain('name');
      expect(error.details.map((d) => d.path[0])).toContain('isSubTable');
    });
  });

  describe('updateTable schema', () => {
    it('should validate valid update table data', () => {
      const validData = {
        name: 'Updated Table Name',
      };

      const { error, value } =
        tableValidationSchemas.updateTable.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual({
        name: 'Updated Table Name',
      });
    });

    it('should trim the table name', () => {
      const dataWithSpaces = {
        name: '  Updated Table  ',
      };

      const { error, value } =
        tableValidationSchemas.updateTable.validate(dataWithSpaces);

      expect(error).toBeUndefined();
      expect(value.name).toBe('Updated Table');
    });

    it('should fail validation for missing name', () => {
      const invalidData = {};

      const { error } =
        tableValidationSchemas.updateTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['name']);
      expect(error.details[0].message).toBe('Table name is required');
    });

    it('should fail validation for empty name', () => {
      const invalidData = {
        name: '',
      };

      const { error } =
        tableValidationSchemas.updateTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['name']);
      expect(error.details[0].message).toBe('Table name cannot be empty');
    });

    it('should fail validation for name with only whitespace', () => {
      const invalidData = {
        name: '   ',
      };

      const { error } =
        tableValidationSchemas.updateTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['name']);
    });

    it('should fail validation for name exceeding max length', () => {
      const invalidData = {
        name: 'a'.repeat(256), // 256 characters
      };

      const { error } =
        tableValidationSchemas.updateTable.validate(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].path).toEqual(['name']);
      expect(error.details[0].message).toBe(
        'Table name cannot exceed 255 characters',
      );
    });

    it('should accept name with exactly 255 characters', () => {
      const validData = {
        name: 'a'.repeat(255),
      };

      const { error } = tableValidationSchemas.updateTable.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should accept name with exactly 1 character (min length)', () => {
      const validData = {
        name: 'A',
      };

      const { error } = tableValidationSchemas.updateTable.validate(validData);

      expect(error).toBeUndefined();
      expect(validData.name).toBe('A');
    });
  });
});
