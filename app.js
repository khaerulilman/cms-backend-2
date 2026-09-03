import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import session from "express-session";

import { config } from "./src/frameworks/config/env.js";
import passport from "./src/frameworks/oauth/google-oauth.js";
import { initSentry } from "./src/frameworks/monitoring/sentry.js";
import { setupSwagger } from "./src/frameworks/docs/swagger.js";
import errorMiddleware from "./src/adapters/middleware/error.middleware.js";
import requestLogger from "./src/adapters/middleware/requestLogger.middleware.js";
import { createApiRoutes } from "./src/adapters/routes/index.js";
import container from "./src/container.js";
import logger from "./src/frameworks/logging/logger.js";

const app = express();

// trigeer push
// Dynamic CORS middleware
app.use((req, res, next) => {
  // Allow all origins for public simplify endpoint
  if (req.path.includes("/simplify")) {
    cors({
      origin: "*",
      credentials: false,
      methods: ["GET", "OPTIONS"],
      allowedHeaders: ["x-api-key", "Content-Type"],
    })(req, res, next);
  } else {
    // Standard CORS for other routes
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        if (config.ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    })(req, res, next);
  }
});

// Request logging
app.use(requestLogger);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie middleware
app.use(cookieParser());

// Session middleware
app.use(
  session({
    secret: config.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true },
  }),
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Swagger API Documentation
setupSwagger(app);

// Root endpoint - Welcome message
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Portfolio CMS API v1.1.1",
    version: "1.0.0",
    environment: config.NODE_ENV,
    endpoints: {
      health: "/health",
      api: "/api",
      docs: "/api-docs",
    },
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount modular API routes created via container controllers
const apiRoutes = createApiRoutes(container.controllers);
app.use(apiRoutes);

// Sentry error tracking — must be after all routes/controllers
initSentry(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Global error handler
app.use(errorMiddleware);

logger.info({ env: config.NODE_ENV }, "App initialized");

export default app;
