import prismaClient from '../../frameworks/database/prisma/client.js';
import logger from '../../frameworks/logging/logger.js';

export const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      logger.warn(
        { ip: req.ip, path: req.originalUrl },
        'API key missing in request',
      );
      return res.status(401).json({
        success: false,
        message: 'API key is required',
      });
    }

    const apiKeyRecord = await prismaClient.apiKey.findUnique({
      where: { apiKey },
      include: {
        user: true,
      },
    });

    if (!apiKeyRecord || !apiKeyRecord.user) {
      logger.warn(
        { ip: req.ip, path: req.originalUrl },
        'Invalid API key used',
      );
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
      });
    }

    req.user = {
      id: apiKeyRecord.user.id,
      email: apiKeyRecord.user.email,
    };

    logger.debug({ userId: apiKeyRecord.user.id }, 'API key authenticated');
    next();
  } catch (error) {
    logger.error(
      { err: error, path: req.originalUrl },
      'API key validation error',
    );
    return res.status(500).json({
      success: false,
      message: 'API key validation failed',
    });
  }
};

export default apiKeyMiddleware;
