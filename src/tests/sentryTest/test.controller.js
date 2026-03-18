/**
 * @desc Testing endpoint for Sentry error tracking
 * @route GET /api/v1/test/error
 * @access Public (for testing only - remove in production)
 */
export const triggerError = (req, res, next) => {
  const errorType = req.query.type || "unhandled";

  switch (errorType) {
    case "validation":
      // Simulates validation error
      const error = new Error("Validation failed: Invalid input");
      error.statusCode = 422;
      return next(error);

    case "unauthorized":
      // Simulates unauthorized error
      const authError = new Error("Unauthorized access");
      authError.statusCode = 401;
      return next(authError);

    case "database":
      // Simulates database error
      const dbError = new Error("Database connection failed");
      dbError.statusCode = 500;
      dbError.details = "Could not connect to PostgreSQL";
      return next(dbError);

    case "unhandled":
    default:
      // Simulates unhandled/internal server error
      throw new Error("This is a test error for Sentry tracking");
  }
};

/**
 * @desc Health check endpoint for Sentry
 * @route GET /api/v1/test/health
 * @access Public
 */
export const testHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Test endpoint is working",
    timestamp: new Date().toISOString(),
  });
};

export default {
  triggerError,
  testHealth,
};
