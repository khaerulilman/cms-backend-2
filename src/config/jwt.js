import jwt from 'jsonwebtoken';

import logger from '../utils/logger.js';

import { config } from './env.js';

export class JwtConfig {
  static generateToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn,
      algorithm: 'HS256',
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET, {
        algorithms: ['HS256'],
      });
    } catch (error) {
      logger.debug({ errorName: error.name }, 'JWT verification failed');
      return null;
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

export default JwtConfig;
