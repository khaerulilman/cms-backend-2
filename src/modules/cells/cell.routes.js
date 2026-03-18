import path from 'path';

import { Router } from 'express';
import multer from 'multer';

import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { sanitizeInput } from '../../middlewares/sanitize.middleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

import CellController from './cell.controller.js';
import { cellValidationSchemas } from './cell.validation.js';

const router = Router();
const controller = new CellController();

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
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow image files
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

// All routes require authentication
router.use(authMiddleware);

// Get all cells for a specific row
router.get(
  '/row/:rowId',
  sanitizeInput,
  validateRequest(cellValidationSchemas.getCellsByRow, 'params'),
  (req, res, next) => controller.getCellsByRow(req, res, next),
);

// Upsert cell (update if exists, create if not) - with optional image upload
router.post(
  '/row/:rowId',
  upload.single('image'),
  sanitizeInput,
  validateRequest(cellValidationSchemas.upsertCell, ['params', 'body']),
  (req, res, next) => controller.upsertCell(req, res, next),
);

export default router;
