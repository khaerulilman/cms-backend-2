import dotenv from 'dotenv';

dotenv.config();

const parseAllowedOrigins = (originsStr) => {
  if (!originsStr) {
    return ['http://localhost:3000', 'http://localhost:5173'];
  }
  return originsStr.split(',').map((origin) => origin.trim());
};

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ALLOWED_ORIGINS: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
  COOKIE_CROSS_SITE: process.env.COOKIE_CROSS_SITE === 'true' || process.env.COOKIE_CROSS_SITE === true,
};

export default config;
