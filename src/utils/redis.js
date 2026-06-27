import { redis } from '../config/env.js';

import logger from './logger.js';

const CACHE_TTL_SECONDS = 600;
let redisConnected = false;

const stableStringify = (value) => {
  if (!value || typeof value !== 'object') {
    return JSON.stringify(value ?? {});
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => JSON.parse(stableStringify(item))));
  }

  const sorted = Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = value[key];
      return acc;
    }, {});

  return JSON.stringify(sorted);
};

const getIndexKey = (resource) => `cache-index:${resource}`;

const buildCacheKey = (resource, req) => {
  const userId = req.user?.id || 'anonymous';
  const path = req.originalUrl.split('?')[0];
  const query = stableStringify(req.query);
  const params = stableStringify(req.params);

  return `${resource}:user:${userId}:path:${path}:params:${params}:query:${query}`;
};

export const initializeRedis = async () => {
  try {
    await redis.ping();
    redisConnected = true;
    logger.info('✅ Redis Connected');
  } catch (error) {
    redisConnected = false;
    logger.warn({ error: error.message }, '❌ Redis Not Connected');
  }
};

export const cacheResponse = (resource) => async (req, res, next) => {
  if (!redisConnected || req.method !== 'GET') {
    return next();
  }

  const cacheKey = buildCacheKey(resource, req);

  try {
    const cachedResponse = await redis.get(cacheKey);

    if (cachedResponse) {
      logger.info(`Redis HIT : ${resource}`);
      return res.status(cachedResponse.statusCode).json(cachedResponse.body);
    }

    logger.info(`Redis MISS : ${resource}`);
  } catch (error) {
    logger.warn(
      { resource, error: error.message },
      'Redis cache read failed, falling back to database',
    );
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const responseToCache = {
        statusCode: res.statusCode,
        body,
      };

      redis
        .set(cacheKey, responseToCache, { ex: CACHE_TTL_SECONDS })
        .then(() => redis.sadd(getIndexKey(resource), cacheKey))
        .then(() => redis.expire(getIndexKey(resource), CACHE_TTL_SECONDS * 2))
        .catch((error) => {
          logger.warn(
            { resource, error: error.message },
            'Redis cache write failed',
          );
        });
    }

    return originalJson(body);
  };

  return next();
};

const invalidateResource = async (resource) => {
  const indexKey = getIndexKey(resource);
  const cacheKeys = await redis.smembers(indexKey);

  if (cacheKeys.length > 0) {
    await redis.del(...cacheKeys);
  }

  await redis.del(indexKey);
  logger.info(`Redis INVALIDATE : ${resource}`);
};

export const invalidateCache = (resources) => (req, res, next) => {
  if (!redisConnected) {
    return next();
  }

  const originalJson = res.json.bind(res);
  const resourceList = Array.isArray(resources) ? resources : [resources];

  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      Promise.all(resourceList.map((resource) => invalidateResource(resource)))
        .catch((error) => {
          logger.warn(
            { resources: resourceList, error: error.message },
            'Redis cache invalidation failed',
          );
        })
        .finally(() => originalJson(body));

      return res;
    }

    return originalJson(body);
  };

  return next();
};
