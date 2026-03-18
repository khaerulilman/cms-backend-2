import prisma from "../../prisma/client.js";
import logger from "../../utils/logger.js";

export class AuthRepository {
  async findUserByEmail(email) {
    logger.debug({ email }, "Finding user by email");
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data) {
    logger.debug({ email: data.email }, "Creating new user");
    return prisma.user.create({
      data,
    });
  }

  async findUserById(id) {
    logger.debug({ userId: id }, "Finding user by ID");
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id, data) {
    logger.debug({ userId: id }, "Updating user");
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  // Refresh Token methods
  async createRefreshToken(data) {
    logger.debug({ userId: data.userId }, "Creating refresh token in database");
    return prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(token) {
    logger.debug({}, "Finding refresh token in database");
    return prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async revokeRefreshToken(token) {
    logger.debug({}, "Revoking refresh token");
    return prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async deleteRefreshToken(token) {
    logger.debug({}, "Deleting refresh token");
    return prisma.refreshToken.delete({
      where: { token },
    });
  }

  async revokeAllUserTokens(userId) {
    logger.debug({ userId }, "Revoking all user tokens");
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });
  }

  async deleteExpiredTokens() {
    logger.debug({}, "Deleting expired tokens");
    return prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async getUserActiveTokens(userId) {
    logger.debug({ userId }, "Fetching user active tokens");
    return prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export default AuthRepository;
