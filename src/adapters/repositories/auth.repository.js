import logger from '../../frameworks/logging/logger.js';

export class AuthRepository {
  /**
   * @param {import('@prisma/client').PrismaClient} prisma
   */
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findUserByEmail(email) {
    logger.debug({ email }, 'Finding user by email');
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data) {
    logger.debug({ email: data.email }, 'Creating new user');
    return this.prisma.user.create({
      data,
    });
  }

  async findUserById(id) {
    logger.debug({ userId: id }, 'Finding user by ID');
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id, data) {
    logger.debug({ userId: id }, 'Updating user');
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // Refresh Token methods
  async createRefreshToken(data) {
    logger.debug({ userId: data.userId }, 'Creating refresh token in database');
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(token) {
    logger.debug({}, 'Finding refresh token in database');
    return this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async revokeRefreshToken(token) {
    logger.debug({}, 'Revoking refresh token');
    return this.prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async deleteRefreshToken(token) {
    logger.debug({}, 'Deleting refresh token');
    return this.prisma.refreshToken.delete({
      where: { token },
    });
  }

  async revokeAllUserTokens(userId) {
    logger.debug({ userId }, 'Revoking all user tokens');
    return this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });
  }

  async deleteExpiredTokens() {
    logger.debug({}, 'Deleting expired tokens');
    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async getUserActiveTokens(userId) {
    logger.debug({ userId }, 'Fetching user active tokens');
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export default AuthRepository;
