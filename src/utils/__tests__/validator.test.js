import { describe, it, expect } from 'vitest';

import { Validator } from '../validator.js';

describe('Validator', () => {
  describe('isEmail', () => {
    it('should return true for valid email', () => {
      expect(Validator.isEmail('test@example.com')).toBe(true);
      expect(Validator.isEmail('user.name@domain.org')).toBe(true);
      expect(Validator.isEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(Validator.isEmail('invalid')).toBe(false);
      expect(Validator.isEmail('invalid@')).toBe(false);
      expect(Validator.isEmail('@domain.com')).toBe(false);
      expect(Validator.isEmail('test@')).toBe(false);
      expect(Validator.isEmail('')).toBe(false);
    });

    it('should return false for email with spaces', () => {
      expect(Validator.isEmail('test @example.com')).toBe(false);
      expect(Validator.isEmail('test@ example.com')).toBe(false);
      expect(Validator.isEmail('te st@example.com')).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('should return true for strong password', () => {
      expect(Validator.isStrongPassword('Password1')).toBe(true);
      expect(Validator.isStrongPassword('StrongP@ss123')).toBe(true);
      expect(Validator.isStrongPassword('MySecure1Password')).toBe(true);
    });

    it('should return false for password without uppercase', () => {
      expect(Validator.isStrongPassword('password1')).toBe(false);
      expect(Validator.isStrongPassword('weakpassword123')).toBe(false);
    });

    it('should return false for password without number', () => {
      expect(Validator.isStrongPassword('Password')).toBe(false);
      expect(Validator.isStrongPassword('StrongPassword')).toBe(false);
    });

    it('should return false for password less than 8 characters', () => {
      expect(Validator.isStrongPassword('Pass1')).toBe(false);
      expect(Validator.isStrongPassword('Ab1')).toBe(false);
    });

    it('should return false for empty password', () => {
      expect(Validator.isStrongPassword('')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID', () => {
      expect(
        Validator.isValidUUID('123e4567-e89b-12d3-a456-426614174000'),
      ).toBe(true);
      expect(
        Validator.isValidUUID('550e8400-e29b-41d4-a716-446655440000'),
      ).toBe(true);
      expect(
        Validator.isValidUUID('A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'),
      ).toBe(true);
    });

    it('should return false for invalid UUID', () => {
      expect(Validator.isValidUUID('not-a-uuid')).toBe(false);
      expect(Validator.isValidUUID('123')).toBe(false);
      expect(Validator.isValidUUID('')).toBe(false);
      expect(Validator.isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
    });

    it('should return false for UUID with wrong format', () => {
      expect(Validator.isValidUUID('123e4567e89b12d3a456426614174000')).toBe(
        false,
      );
      expect(Validator.isValidUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(
        false,
      );
    });
  });

  describe('isEmpty', () => {
    it('should return true for null', () => {
      expect(Validator.isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(Validator.isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(Validator.isEmpty('')).toBe(true);
      expect(Validator.isEmpty('   ')).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(Validator.isEmpty([])).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(Validator.isEmpty({})).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(Validator.isEmpty('hello')).toBe(false);
      expect(Validator.isEmpty([1, 2, 3])).toBe(false);
      expect(Validator.isEmpty({ key: 'value' })).toBe(false);
      expect(Validator.isEmpty(0)).toBe(false);
      expect(Validator.isEmpty(false)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(Validator.validateEmail('test@example.com')).toBe(true);
    });

    it('should throw error for empty email', () => {
      expect(() => Validator.validateEmail('')).toThrow('Email is required');
      expect(() => Validator.validateEmail(null)).toThrow('Email is required');
      expect(() => Validator.validateEmail(undefined)).toThrow(
        'Email is required',
      );
    });

    it('should throw error for invalid email format', () => {
      expect(() => Validator.validateEmail('invalid')).toThrow(
        'Invalid email format',
      );
      expect(() => Validator.validateEmail('test@')).toThrow(
        'Invalid email format',
      );
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', () => {
      expect(Validator.validatePassword('password123')).toBe(true);
      expect(Validator.validatePassword('sixchr')).toBe(true);
    });

    it('should throw error for empty password', () => {
      expect(() => Validator.validatePassword('')).toThrow(
        'Password is required',
      );
      expect(() => Validator.validatePassword(null)).toThrow(
        'Password is required',
      );
      expect(() => Validator.validatePassword(undefined)).toThrow(
        'Password is required',
      );
    });

    it('should throw error for password less than 6 characters', () => {
      expect(() => Validator.validatePassword('12345')).toThrow(
        'Password must be at least 6 characters',
      );
      expect(() => Validator.validatePassword('abc')).toThrow(
        'Password must be at least 6 characters',
      );
    });
  });

  describe('validateName', () => {
    it('should return true for valid name', () => {
      expect(Validator.validateName('John')).toBe(true);
      expect(Validator.validateName('John Doe')).toBe(true);
      expect(Validator.validateName('Jo')).toBe(true);
    });

    it('should throw error for empty name', () => {
      expect(() => Validator.validateName('')).toThrow('Name is required');
      expect(() => Validator.validateName(null)).toThrow('Name is required');
      expect(() => Validator.validateName(undefined)).toThrow(
        'Name is required',
      );
    });

    it('should throw error for name less than 2 characters', () => {
      expect(() => Validator.validateName('J')).toThrow(
        'Name must be at least 2 characters',
      );
    });

    it('should handle whitespace-only name', () => {
      expect(() => Validator.validateName('   ')).toThrow('Name is required');
    });
  });
});
