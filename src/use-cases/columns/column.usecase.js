import { v4 as uuidv4 } from 'uuid';

import { ERROR_MESSAGES } from '../../entities/constants/http.js';
import { NotFoundError, ValidationError } from '../../entities/errors/index.js';
import logger from '../../frameworks/logging/logger.js';

export class ColumnUseCase {

  constructor({ columnRepository, imageCleanupService }) {
    this.repository = columnRepository;
    this.imageCleanupService = imageCleanupService;
  }

  async createColumns(tableId, userId, columns) {
    logger.debug({ tableId, columnCount: columns.length, userId }, 'Create columns use-case called');
    if (!tableId || tableId.trim() === '') {
      logger.warn({ userId }, 'Table ID is missing or empty');
      throw new ValidationError(ERROR_MESSAGES.TABLE_ID_REQUIRED);
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      logger.warn({ tableId, userId }, 'Columns array is empty');
      throw new ValidationError(ERROR_MESSAGES.COLUMNS_EMPTY);
    }

    for (const column of columns) {
      if (!column.name || column.name.trim() === '') {
        logger.warn({ tableId, userId }, 'Column name is missing or empty');
        throw new ValidationError(ERROR_MESSAGES.COLUMN_NAME_REQUIRED);
      }
    }

    const isTableOwner = await this.repository.checkTableOwnership(tableId, userId);
    if (!isTableOwner) {
      logger.warn({ tableId, userId }, 'Table ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.TABLE_NOT_FOUND);
    }

    const columnsData = columns.map((column) => ({
      id: uuidv4(),
      tableId,
      name: column.name.trim(),
    }));

    const createdColumns = await this.repository.createColumns(columnsData);
    logger.info({ tableId, userId, createdCount: createdColumns.length }, 'Columns created');
    return createdColumns.map((col) => this._formatColumn(col));
  }

  async getColumnsByTable(tableId, userId) {
    logger.debug({ tableId, userId }, 'Get columns by table use-case called');
    const isTableOwner = await this.repository.checkTableOwnership(tableId, userId);
    if (!isTableOwner) {
      logger.warn({ tableId, userId }, 'Table ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.TABLE_NOT_FOUND);
    }

    const columns = await this.repository.findColumnsByTableId(tableId);
    logger.info({ tableId, columnCount: columns.length }, 'Columns retrieved from table');
    return columns.map((col) => this._formatColumn(col));
  }

  async getColumnById(columnId, userId) {
    logger.debug({ columnId, userId }, 'Get column by ID use-case called');
    const isOwner = await this.repository.checkColumnOwnership(columnId, userId);
    if (!isOwner) {
      logger.warn({ columnId, userId }, 'Column ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.COLUMN_NOT_FOUND);
    }

    const column = await this.repository.findColumnById(columnId);
    if (!column) {
      logger.warn({ columnId }, 'Column not found in database');
      throw new NotFoundError(ERROR_MESSAGES.COLUMN_NOT_FOUND);
    }

    logger.info({ columnId, columnName: column.name }, 'Column retrieved by ID');
    return this._formatColumn(column);
  }

  async updateColumn(columnId, userId, data) {
    logger.debug({ columnId, newName: data.name, userId }, 'Update column use-case called');
    if (!data.name || data.name.trim() === '') {
      logger.warn({ columnId, userId }, 'Column name is missing or empty for update');
      throw new ValidationError(ERROR_MESSAGES.COLUMN_NAME_REQUIRED);
    }

    const isOwner = await this.repository.checkColumnOwnership(columnId, userId);
    if (!isOwner) {
      logger.warn({ columnId, userId }, 'Column ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.COLUMN_NOT_FOUND);
    }

    const column = await this.repository.updateColumn(columnId, { name: data.name.trim() });
    if (!column) {
      logger.warn({ columnId }, 'Column not found after update');
      throw new NotFoundError(ERROR_MESSAGES.COLUMN_NOT_FOUND);
    }

    logger.info({ columnId, userId, newName: column.name }, 'Column updated successfully');
    return this._formatColumn(column);
  }

  async deleteColumn(columnId, userId) {
    logger.debug({ columnId, userId }, 'Delete column use-case called');
    const isOwner = await this.repository.checkColumnOwnership(columnId, userId);
    if (!isOwner) {
      logger.warn({ columnId, userId }, 'Column ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.COLUMN_NOT_FOUND);
    }

    logger.debug({ columnId }, 'Cleaning up images from column');
    await this.imageCleanupService.deleteImagesByColumnId(columnId);

    const column = await this.repository.deleteColumn(columnId);
    if (!column) {
      logger.warn({ columnId }, 'Column not found after deletion');
      throw new NotFoundError(ERROR_MESSAGES.COLUMN_NOT_FOUND);
    }

    logger.info({ columnId, userId, deletedName: column.name }, 'Column deleted with image cleanup');
    return this._formatColumn(column);
  }

  _formatColumn(column) {
    return {
      id: column.id,
      tableId: column.tableId,
      name: column.name,
      createdAt: column.createdAt,
      updatedAt: column.updatedAt,
    };
  }
}

export default ColumnUseCase;
