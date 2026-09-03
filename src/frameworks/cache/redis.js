import { Redis } from '@upstash/redis';

import { config } from '../config/env.js';
import logger from '../logging/logger.js';

let redisClient = null;

export const initializeRedis = async () => {
  if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) {
    logger.warn('Upstash Redis credentials not found, caching disabled');
    return null;
  }

  try {
    redisClient = new Redis({
      url: config.UPSTASH_REDIS_REST_URL,
      token: config.UPSTASH_REDIS_REST_TOKEN,
    });

    await redisClient.ping();
    logger.info('Upstash Redis connected successfully');
    return redisClient;
  } catch (error) {
    logger.error({ err: error }, 'Upstash Redis connection failed');
    redisClient = null;
    return null;
  }
};

export const getRedisClient = () => redisClient;

export const cacheResponse = (prefix, ttlSeconds = 300) => {
  return async (req, res, next) => {
    if (!redisClient) {
      return next();
    }

    try {
      const userId = req.user?.id || 'public';
      const cacheKey = `${prefix}:${userId}:${req.originalUrl}`;

      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.debug({ cacheKey }, 'Cache hit');
        return res.json(cachedData);
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setex(cacheKey, ttlSeconds, JSON.stringify(body)).catch((err) => {
            logger.error({ err, cacheKey }, 'Failed to set cache');
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error({ err: error }, 'Cache middleware error');
      next();
    }
  };
};

export const invalidateCache = (prefixes = []) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (redisClient && res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const userId = req.user?.id || 'public';
          for (const prefix of prefixes) {
            const pattern = `${prefix}:${userId}:*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
              await redisClient.del(...keys);
              logger.debug({ pattern, count: keys.length }, 'Cache invalidated');
            }
          }
        } catch (err) {
          logger.error({ err }, 'Failed to invalidate cache');
        }
      }
      return originalJson(body);
    };

    next();
  };
};

export default {
  initializeRedis,
  getRedisClient,
  cacheResponse,
  invalidateCache,
};
