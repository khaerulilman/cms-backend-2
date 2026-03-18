import fs from 'fs/promises';
import path from 'path';

import logger from './logger.js';

export class FileUtils {
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug({ filePath }, 'File deleted');
    } catch (error) {
      logger.error({ filePath, err: error }, 'Failed to delete file');
    }
  }

  static async ensureUploadsDir() {
    const uploadsDir = path.resolve('uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
  }

  static async cleanOldFiles(dirPath, maxAgeMs = 24 * 60 * 60 * 1000) {
    try {
      const files = await fs.readdir(dirPath);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAgeMs && stats.isFile()) {
          await this.deleteFile(filePath);
        }
      }
    } catch (error) {
      logger.error({ dirPath, err: error }, 'Failed to clean old files');
    }
  }
}

export default FileUtils;
