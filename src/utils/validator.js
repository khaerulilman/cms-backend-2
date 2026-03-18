export class Validator {
  static isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isStrongPassword(password) {
    // At least 8 characters, 1 uppercase, 1 number
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }

  static isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static isEmpty(value) {
    return (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0)
    );
  }

  static validateEmail(email) {
    if (this.isEmpty(email)) {
      throw new Error('Email is required');
    }
    if (!this.isEmail(email)) {
      throw new Error('Invalid email format');
    }
    return true;
  }

  static validatePassword(password) {
    if (this.isEmpty(password)) {
      throw new Error('Password is required');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    return true;
  }

  static validateName(name) {
    if (this.isEmpty(name)) {
      throw new Error('Name is required');
    }
    if (name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    return true;
  }
}

export default Validator;
