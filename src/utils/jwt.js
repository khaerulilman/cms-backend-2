import { randomUUID } from "crypto";

import JwtConfig from "../config/jwt.js";

import logger from "./logger.js";

export class JwtUtil {
  static generateAccessToken(userId, email) {
    logger.debug({ userId }, "Generating access token");
    return JwtConfig.generateToken(
      {
        id: userId,
        email,
        type: "access",
      },
      "7d",
    );
  }

  static generateRefreshToken(userId, email) {
    logger.debug({ userId }, "Generating refresh token");
    return JwtConfig.generateToken(
      {
        id: userId,
        email,
        type: "refresh",
        jti: randomUUID(),
      },
      "30d",
    );
  }

  // Short-lived token for establishing session via proxy after OAuth
  static generateSetupToken(userId, email) {
    logger.debug({ userId }, "Generating setup token");
    return JwtConfig.generateToken(
      {
        id: userId,
        email,
        type: "setup",
      },
      "60s",
    );
  }

  static verifyToken(token) {
    return JwtConfig.verifyToken(token);
  }

  static decodeToken(token) {
    return JwtConfig.decodeToken(token);
  }
}

export default JwtUtil;
