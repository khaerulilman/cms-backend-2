import path from 'path';
import { Router } from 'express';
import multer from 'multer';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { cacheResponse, invalidateCache } from '../../frameworks/cache/redis.js';
import { cellValidationSchemas } from '../services/validation/cell.validation.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const createCellRoutes = (cellController) => {
  const router = Router();

  router.use(authMiddleware);

  // Get all cells for a specific row
  router.get(
    '/row/:rowId',
    sanitizeInput,
    validateRequest(cellValidationSchemas.getCellsByRow, 'params'),
    cacheResponse('cms-cells'),
    (req, res, next) => cellController.getCellsByRow(req, res, next),
  );

  // Upsert cell (update if exists, create if not) - with optional image upload
  router.post(
    '/row/:rowId',
    upload.single('image'),
    sanitizeInput,
    validateRequest(cellValidationSchemas.upsertCell, ['params', 'body']),
    invalidateCache(['cms-cells', 'cms-rows', 'tables']),
    (req, res, next) => cellController.upsertCell(req, res, next),
  );

  return router;
};

export default createCellRoutes;
