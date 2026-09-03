import logger from '../../frameworks/logging/logger.js';

export class ApiKeyRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findApiKeysByUserId(userId) {
    logger.debug({ userId }, 'Querying API keys by user ID');
    return this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findApiKeyById(id) {
    return this.prisma.apiKey.findUnique({
      where: { id },
    });
  }

  async findApiKeyByKey(apiKey) {
    return this.prisma.apiKey.findUnique({
      where: { apiKey },
    });
  }

  async createApiKey(data) {
    logger.debug({ userId: data.userId }, 'Creating new API key in database');
    return this.prisma.apiKey.create({
      data,
    });
  }

  async deleteApiKey(id) {
    return this.prisma.apiKey.delete({
      where: { id },
    });
  }

  async deleteApiKeyByKey(apiKey) {
    return this.prisma.apiKey.delete({
      where: { apiKey },
    });
  }

  async updateApiKey(id, data) {
    return this.prisma.apiKey.update({
      where: { id },
      data,
    });
  }
}

export default ApiKeyRepository;
