import { NotFoundError } from '../../entities/errors/index.js';
import logger from '../../frameworks/logging/logger.js';

export class CellUseCase {
  /**
   * @param {object} deps
   * @param {import('../../adapters/repositories/cell.repository.js').CellRepository} deps.cellRepository
   * @param {import('../../adapters/services/cloudinary.service.js').CloudinaryService} deps.cloudinaryService
   */
  constructor({ cellRepository, cloudinaryService }) {
    this.repository = cellRepository;
    this.cloudinaryService = cloudinaryService;
  }

  async getCellsByRow(rowId, userId) {
    const isRowOwner = await this.repository.checkRowOwnership(rowId, userId);
    if (!isRowOwner) {
      logger.warn({ rowId, userId }, 'Row ownership check failed');
      throw new NotFoundError('Row not found');
    }

    const cells = await this.repository.findCellsByRowId(rowId);
    logger.debug({ rowId, cellCount: cells.length }, 'Cells fetched by row');
    return cells.map((cell) => this._formatCell(cell));
  }

  async upsertCell(rowId, columnId, userId, value, imageFile = null) {
    const isRowOwner = await this.repository.checkRowOwnership(rowId, userId);
    if (!isRowOwner) {
      throw new NotFoundError('Row not found');
    }

    const existingCell = await this.repository.findCellByRowAndColumn(rowId, columnId);

    let finalValue = null;
    let imageUrl = null;
    let cloudinaryPublicId = null;

    if (imageFile) {
      try {
        if (existingCell && existingCell.cloudinaryPublicId) {
          await this.cloudinaryService.deleteImage(existingCell.cloudinaryPublicId);
          logger.debug({ publicId: existingCell.cloudinaryPublicId }, 'Old cell image deleted');
        }

        const uploadResult = await this.cloudinaryService.uploadImage(imageFile.path);
        imageUrl = uploadResult.imageUrl;
        cloudinaryPublicId = uploadResult.publicId;
        logger.info({ rowId, columnId, publicId: cloudinaryPublicId }, 'Cell image uploaded');

        finalValue = null;
      } catch (error) {
        logger.error({ err: error, rowId, columnId }, 'Cell image upload failed');
        throw new Error(`Failed to upload image: ${error.message}`);
      }
    } else if (value && value.trim()) {
      finalValue = value.trim();

      if (existingCell && existingCell.cloudinaryPublicId) {
        try {
          await this.cloudinaryService.deleteImage(existingCell.cloudinaryPublicId);
        } catch (error) {
          logger.error({ cloudinaryPublicId: existingCell.cloudinaryPublicId, err: error }, 'Failed to delete image from Cloudinary');
        }
      }

      imageUrl = null;
      cloudinaryPublicId = null;
    } else {
      finalValue = null;

      if (existingCell && existingCell.cloudinaryPublicId) {
        try {
          await this.cloudinaryService.deleteImage(existingCell.cloudinaryPublicId);
        } catch (error) {
          logger.error({ cloudinaryPublicId: existingCell.cloudinaryPublicId, err: error }, 'Failed to delete image from Cloudinary');
        }
      }

      imageUrl = null;
      cloudinaryPublicId = null;
    }

    const cell = await this.repository.upsertCell(rowId, columnId, finalValue, imageUrl, cloudinaryPublicId);

    if (!cell) {
      throw new NotFoundError('Cell not found');
    }

    return this._formatCell(cell);
  }

  _formatCell(cell) {
    return {
      id: cell.id,
      rowId: cell.rowId,
      columnId: cell.columnId,
      columnName: cell.column?.name,
      value: cell.value,
      imageUrl: cell.imageUrl,
      cloudinaryPublicId: cell.cloudinaryPublicId,
      createdAt: cell.createdAt,
      updatedAt: cell.updatedAt,
    };
  }
}

export default CellUseCase;
