export const triggerError = (req, res, next) => {
  const errorType = req.query.type || 'unhandled';

  switch (errorType) {
    case 'validation': {
      const error = new Error('Validation failed: Invalid input');
      error.statusCode = 422;
      return next(error);
    }
    case 'unauthorized': {
      const authError = new Error('Unauthorized access');
      authError.statusCode = 401;
      return next(authError);
    }
    case 'database': {
      const dbError = new Error('Database connection failed');
      dbError.statusCode = 500;
      dbError.details = 'Could not connect to PostgreSQL';
      return next(dbError);
    }
    case 'unhandled':
    default:
      throw new Error('This is a test error for Sentry tracking');
  }
};

export const testHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString(),
  });
};

export class DiagnosticController {
  triggerError(req, res, next) {
    return triggerError(req, res, next);
  }

  testHealth(req, res) {
    return testHealth(req, res);
  }
}

export default DiagnosticController;
