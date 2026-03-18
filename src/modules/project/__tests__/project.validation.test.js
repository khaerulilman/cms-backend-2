import { describe, it, expect } from 'vitest';

import { projectValidationSchemas } from '../project.validation.js';

describe('Project Validation Schemas', () => {
  describe('create schema', () => {
    describe('valid input', () => {
      it('should validate with valid name', () => {
        const validData = {
          name: 'My Project',
        };

        const { error, value } =
          projectValidationSchemas.create.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          name: 'My Project',
        });
      });

      it('should validate with name and description', () => {
        const validData = {
          name: 'Portfolio Project',
          description: 'A portfolio project management system',
        };

        const { error, value } =
          projectValidationSchemas.create.validate(validData);

        expect(error).toBeUndefined();
        expect(value.name).toBe('Portfolio Project');
        expect(value.description).toBe('A portfolio project management system');
      });

      it('should trim whitespace from name', () => {
        const validData = {
          name: '  My Project  ',
          description: '  Project description  ',
        };

        const { error, value } =
          projectValidationSchemas.create.validate(validData);

        expect(error).toBeUndefined();
        expect(value.name).toBe('My Project');
        expect(value.description).toBe('Project description');
      });

      it('should accept null description', () => {
        const validData = {
          name: 'My Project',
          description: null,
        };

        const { error } = projectValidationSchemas.create.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept empty string description', () => {
        const validData = {
          name: 'My Project',
          description: '',
        };

        const { error } = projectValidationSchemas.create.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with minimum name length (1 character)', () => {
        const validData = {
          name: 'A',
        };

        const { error } = projectValidationSchemas.create.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with maximum name length (100 characters)', () => {
        const validData = {
          name: 'a'.repeat(100),
        };

        const { error } = projectValidationSchemas.create.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with maximum description length (500 characters)', () => {
        const validData = {
          name: 'My Project',
          description: 'b'.repeat(500),
        };

        const { error } = projectValidationSchemas.create.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with special characters in name', () => {
        const validData = {
          name: 'Project #1 - 2025',
        };

        const { error } = projectValidationSchemas.create.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid name', () => {
      it('should fail when name is missing', () => {
        const invalidData = {
          description: 'Project description',
        };

        const { error } = projectValidationSchemas.create.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('required');
      });

      it('should fail when name is empty string', () => {
        const invalidData = {
          name: '',
        };

        const { error } = projectValidationSchemas.create.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('required');
      });

      it('should fail when name is only whitespace', () => {
        const invalidData = {
          name: '   ',
        };

        const { error } = projectValidationSchemas.create.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when name exceeds 100 characters', () => {
        const invalidData = {
          name: 'a'.repeat(101),
        };

        const { error } = projectValidationSchemas.create.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('100 characters');
      });

      it('should fail when name is null', () => {
        const invalidData = {
          name: null,
        };

        const { error } = projectValidationSchemas.create.validate(invalidData);

        expect(error).toBeDefined();
      });
    });

    describe('invalid description', () => {
      it('should fail when description exceeds 500 characters', () => {
        const invalidData = {
          name: 'My Project',
          description: 'c'.repeat(501),
        };

        const { error } = projectValidationSchemas.create.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('500 characters');
      });

      it('should fail when description is very long (1000 characters)', () => {
        const invalidData = {
          name: 'My Project',
          description: 'd'.repeat(1000),
        };

        const { error } = projectValidationSchemas.create.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('500 characters');
      });
    });

    describe('multiple invalid fields', () => {
      it('should return error when all fields are invalid', () => {
        const invalidData = {
          name: 'a'.repeat(101),
          description: 'b'.repeat(501),
        };

        const { error } = projectValidationSchemas.create.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should return first error when name is missing and description is invalid', () => {
        const invalidData = {
          description: 'c'.repeat(501),
        };

        const { error } = projectValidationSchemas.create.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('required');
      });
    });
  });

  describe('update schema', () => {
    describe('valid input', () => {
      it('should validate with only name updated', () => {
        const validData = {
          name: 'Updated Project',
        };

        const { error, value } =
          projectValidationSchemas.update.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          name: 'Updated Project',
        });
      });

      it('should validate with only description updated', () => {
        const validData = {
          description: 'Updated description',
        };

        const { error, value } =
          projectValidationSchemas.update.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual({
          description: 'Updated description',
        });
      });

      it('should validate with both name and description updated', () => {
        const validData = {
          name: 'Updated Project',
          description: 'Updated description',
        };

        const { error, value } =
          projectValidationSchemas.update.validate(validData);

        expect(error).toBeUndefined();
        expect(value.name).toBe('Updated Project');
        expect(value.description).toBe('Updated description');
      });

      it('should trim whitespace from name and description', () => {
        const validData = {
          name: '  Updated Project  ',
          description: '  Updated description  ',
        };

        const { error, value } =
          projectValidationSchemas.update.validate(validData);

        expect(error).toBeUndefined();
        expect(value.name).toBe('Updated Project');
        expect(value.description).toBe('Updated description');
      });

      it('should accept null description', () => {
        const validData = {
          name: 'Updated Project',
          description: null,
        };

        const { error } = projectValidationSchemas.update.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept empty string description', () => {
        const validData = {
          name: 'Updated Project',
          description: '',
        };

        const { error } = projectValidationSchemas.update.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with maximum name length (100 characters)', () => {
        const validData = {
          name: 'e'.repeat(100),
        };

        const { error } = projectValidationSchemas.update.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with maximum description length (500 characters)', () => {
        const validData = {
          description: 'f'.repeat(500),
        };

        const { error } = projectValidationSchemas.update.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate with minimum name length (1 character)', () => {
        const validData = {
          name: 'A',
        };

        const { error } = projectValidationSchemas.update.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('invalid name', () => {
      it('should fail when name is empty string', () => {
        const invalidData = {
          name: '',
        };

        const { error } = projectValidationSchemas.update.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('empty');
      });

      it('should fail when name exceeds 100 characters', () => {
        const invalidData = {
          name: 'g'.repeat(101),
        };

        const { error } = projectValidationSchemas.update.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('100 characters');
      });

      it('should fail when name is only whitespace', () => {
        const invalidData = {
          name: '   ',
        };

        const { error } = projectValidationSchemas.update.validate(invalidData);

        expect(error).toBeDefined();
      });
    });

    describe('invalid description', () => {
      it('should fail when description exceeds 500 characters', () => {
        const invalidData = {
          description: 'h'.repeat(501),
        };

        const { error } = projectValidationSchemas.update.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('500 characters');
      });

      it('should fail when description is very long (1000 characters)', () => {
        const invalidData = {
          description: 'i'.repeat(1000),
        };

        const { error } = projectValidationSchemas.update.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('500 characters');
      });
    });

    describe('no fields provided', () => {
      it('should fail when no fields are provided', () => {
        const invalidData = {};

        const { error } = projectValidationSchemas.update.validate(invalidData);

        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('At least one field');
      });

      it('should fail when only null values are provided', () => {
        const invalidData = {
          name: null,
          description: null,
        };

        const { error } = projectValidationSchemas.update.validate(invalidData);

        expect(error).toBeDefined();
      });
    });

    describe('multiple invalid fields', () => {
      it('should return error when all fields are invalid', () => {
        const invalidData = {
          name: 'j'.repeat(101),
          description: 'k'.repeat(501),
        };

        const { error } = projectValidationSchemas.update.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should return error when name is empty and description exceeds limit', () => {
        const invalidData = {
          name: '',
          description: 'l'.repeat(501),
        };

        const { error } = projectValidationSchemas.update.validate(invalidData);

        expect(error).toBeDefined();
      });
    });
  });
});
