import jwt from 'jsonwebtoken';

import { config } from './env.js';

export class JwtConfig {
  static generateToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET);
    } catch {
      return null;
    }
  }

  static decodeToken(token) {
    return jwt.decode(token);
  }
}

export default JwtConfig;
