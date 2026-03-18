import dotenv from "dotenv";

import logger from "../utils/logger.js";

dotenv.config();

export const config = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL,
  // Comma-separated list of allowed origins (includes FRONTEND_URL automatically)
  ALLOWED_ORIGINS: (() => {
    const origins = new Set();
    if (process.env.FRONTEND_URL) origins.add(process.env.FRONTEND_URL.trim());
    if (process.env.ALLOWED_ORIGINS) {
      process.env.ALLOWED_ORIGINS.split(",").forEach((o) =>
        origins.add(o.trim()),
      );
    }
    return [...origins];
  })(),
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  COOKIE_CROSS_SITE: process.env.COOKIE_CROSS_SITE,
  SENTRY_DSN: process.env.SENTRY_DSN || "",
};

// Debug: log CORS origins on startup
logger.debug({ allowedOrigins: config.ALLOWED_ORIGINS }, "CORS origins loaded");

// Validate required env variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "FRONTEND_URL"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export default config;
