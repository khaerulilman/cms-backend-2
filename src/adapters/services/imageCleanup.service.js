import logger from '../../frameworks/logging/logger.js';
import CloudinaryService from './cloudinary.service.js';

export class ImageCleanupService {
  
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Delete semua images yang related dengan User
   * Cascade: User → Projects → Tables → Rows → Cells → Images
   */
  async deleteImagesByUserId(userId) {
    try {
      const cells = await this.prisma.cmsCell.findMany({
        where: {
          row: {
            table: {
              project: {
                userId,
              },
            },
          },
        },
        select: {
          cloudinaryPublicId: true,
        },
      });

      logger.info(
        { userId, imageCount: cells.length },
        'Deleting images for user',
      );
      await this._deleteFromCloudinary(cells);
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to cleanup images for user');
      throw error;
    }
  }

  /**
   * Delete semua images yang related dengan Project
   * Cascade: Project → Tables → Rows → Cells → Images
   */
  async deleteImagesByProjectId(projectId) {
    try {
      const cells = await this.prisma.cmsCell.findMany({
        where: {
          row: {
            table: {
              projectId,
            },
          },
        },
        select: {
          cloudinaryPublicId: true,
        },
      });

      logger.info(
        { projectId, imageCount: cells.length },
        'Deleting images for project',
      );
      await this._deleteFromCloudinary(cells);
    } catch (error) {
      logger.error(
        { err: error, projectId },
        'Failed to cleanup images for project',
      );
      throw error;
    }
  }

  /**
   * Delete semua images yang related dengan Table
   * Cascade: Table → Rows → Cells → Images
   */
  async deleteImagesByTableId(tableId) {
    try {
      const cells = await this.prisma.cmsCell.findMany({
        where: {
          row: {
            tableId,
          },
        },
        select: {
          cloudinaryPublicId: true,
        },
      });

      logger.info(
        { tableId, imageCount: cells.length },
        'Deleting images for table',
      );
      await this._deleteFromCloudinary(cells);
    } catch (error) {
      logger.error(
        { err: error, tableId },
        'Failed to cleanup images for table',
      );
      throw error;
    }
  }

  /**
   * Delete semua images yang related dengan Column
   * Cascade: Column → Cells → Images
   */
  async deleteImagesByColumnId(columnId) {
    try {
      const cells = await this.prisma.cmsCell.findMany({
        where: {
          columnId,
        },
        select: {
          cloudinaryPublicId: true,
        },
      });

      logger.info(
        { columnId, imageCount: cells.length },
        'Deleting images for column',
      );
      await this._deleteFromCloudinary(cells);
    } catch (error) {
      logger.error(
        { err: error, columnId },
        'Failed to cleanup images for column',
      );
      throw error;
    }
  }

  /**
   * Delete semua images yang related dengan Row
   * Cascade: Row → Cells → Images
   */
  async deleteImagesByRowId(rowId) {
    try {
      const cells = await this.prisma.cmsCell.findMany({
        where: {
          rowId,
        },
        select: {
          cloudinaryPublicId: true,
        },
      });

      logger.info(
        { rowId, imageCount: cells.length },
        'Deleting images for row',
      );
      await this._deleteFromCloudinary(cells);
    } catch (error) {
      logger.error({ err: error, rowId }, 'Failed to cleanup images for row');
      throw error;
    }
  }

  /**
   * Delete image untuk single Cell
   * Direct: Cell → Image
   */
  async deleteImagesByCellId(cellId) {
    try {
      const cell = await this.prisma.cmsCell.findUnique({
        where: { id: cellId },
        select: {
          cloudinaryPublicId: true,
        },
      });

      if (cell && cell.cloudinaryPublicId) {
        await CloudinaryService.deleteImage(cell.cloudinaryPublicId);
        logger.info(
          { cellId, publicId: cell.cloudinaryPublicId },
          'Image deleted for cell',
        );
      }
    } catch (error) {
      logger.error({ err: error, cellId }, 'Failed to cleanup image for cell');
      throw error;
    }
  }

  /**
   * Helper method untuk batch delete images dari Cloudinary
   * Non-blocking: jika ada error, log tapi lanjut dengan deletion
   */
  async _deleteFromCloudinary(cells) {
    if (!cells || cells.length === 0) {
      return;
    }

    const publicIds = cells
      .filter((cell) => cell.cloudinaryPublicId)
      .map((cell) => cell.cloudinaryPublicId);

    if (publicIds.length === 0) {
      return;
    }

    try {
      await CloudinaryService.deleteImages(publicIds);
      logger.info(
        { count: publicIds.length },
        'Batch Cloudinary cleanup completed',
      );
    } catch (error) {
      logger.error(
        { err: error, count: publicIds.length },
        'Failed to batch delete images from Cloudinary',
      );
      // Non-blocking: jangan throw error, biar database deletion tetap jalan
    }
  }

  /**
   * Get semua cloudinaryPublicIds untuk debugging/monitoring
   */
  async getImagesByUserId(userId) {
    return this.prisma.cmsCell.findMany({
      where: {
        row: {
          table: {
            project: {
              userId,
            },
          },
        },
      },
      select: {
        id: true,
        cloudinaryPublicId: true,
        imageUrl: true,
      },
    });
  }

  async getImagesByProjectId(projectId) {
    return this.prisma.cmsCell.findMany({
      where: {
        row: {
          table: {
            projectId,
          },
        },
      },
      select: {
        id: true,
        cloudinaryPublicId: true,
        imageUrl: true,
      },
    });
  }

  async getImagesByTableId(tableId) {
    return this.prisma.cmsCell.findMany({
      where: {
        row: {
          tableId,
        },
      },
      select: {
        id: true,
        cloudinaryPublicId: true,
        imageUrl: true,
      },
    });
  }

  async getImagesByRowId(rowId) {
    return this.prisma.cmsCell.findMany({
      where: {
        rowId,
      },
      select: {
        id: true,
        cloudinaryPublicId: true,
        imageUrl: true,
      },
    });
  }

  async getImagesByColumnId(columnId) {
    return this.prisma.cmsCell.findMany({
      where: {
        columnId,
      },
      select: {
        id: true,
        cloudinaryPublicId: true,
        imageUrl: true,
      },
    });
  }
}

export default ImageCleanupService;
