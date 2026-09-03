import { v4 as uuidv4 } from 'uuid';

import { ERROR_MESSAGES } from '../../entities/constants/http.js';
import { NotFoundError } from '../../entities/errors/index.js';
import logger from '../../frameworks/logging/logger.js';

export class RowUseCase {

  constructor({ rowRepository, imageCleanupService }) {
    this.repository = rowRepository;
    this.imageCleanupService = imageCleanupService;
  }

  async createRow(tableId, userId) {
    logger.debug({ tableId, userId }, 'Create row use-case called');
    const isTableOwner = await this.repository.checkTableOwnership(tableId, userId);
    if (!isTableOwner) {
      logger.warn({ tableId, userId }, 'Table ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.TABLE_NOT_FOUND);
    }

    const row = await this.repository.createRow({ id: uuidv4(), tableId });
    logger.info({ rowId: row.id, tableId, userId }, 'Row created');
    return this._formatRow(row);
  }

  async getRowsByTable(tableId, userId) {
    logger.debug({ tableId, userId }, 'Get rows by table use-case called');
    const isTableOwner = await this.repository.checkTableOwnership(tableId, userId);
    if (!isTableOwner) {
      logger.warn({ tableId, userId }, 'Table ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.TABLE_NOT_FOUND);
    }

    const rows = await this.repository.findRowsByTableId(tableId);
    logger.info({ tableId, rowCount: rows.length }, 'Rows retrieved from table');
    return rows.map((row) => this._formatRow(row));
  }

  async getRowById(rowId, userId) {
    logger.debug({ rowId, userId }, 'Get row by ID use-case called');
    const isOwner = await this.repository.checkRowOwnership(rowId, userId);
    if (!isOwner) {
      logger.warn({ rowId, userId }, 'Row ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.ROW_NOT_FOUND);
    }

    const row = await this.repository.findRowById(rowId);
    if (!row) {
      logger.warn({ rowId }, 'Row not found in database');
      throw new NotFoundError(ERROR_MESSAGES.ROW_NOT_FOUND);
    }

    logger.info({ rowId, userId, cellCount: row.cells.length }, 'Row retrieved by ID');
    return this._formatRow(row);
  }

  async updateRow(rowId, userId, _data) {
    logger.debug({ rowId, userId }, 'Update row use-case called');
    const isOwner = await this.repository.checkRowOwnership(rowId, userId);
    if (!isOwner) {
      logger.warn({ rowId, userId }, 'Row ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.ROW_NOT_FOUND);
    }

    const row = await this.repository.findRowById(rowId);
    if (!row) {
      logger.warn({ rowId }, 'Row not found in database');
      throw new NotFoundError(ERROR_MESSAGES.ROW_NOT_FOUND);
    }

    logger.info({ rowId, userId }, 'Row retrieved for update');
    return this._formatRow(row);
  }

  async deleteRow(rowId, userId) {
    logger.debug({ rowId, userId }, 'Delete row use-case called');
    const isOwner = await this.repository.checkRowOwnership(rowId, userId);
    if (!isOwner) {
      logger.warn({ rowId, userId }, 'Row ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.ROW_NOT_FOUND);
    }

    logger.debug({ rowId }, 'Cleaning up images from row');
    await this.imageCleanupService.deleteImagesByRowId(rowId);

    const row = await this.repository.deleteRow(rowId);
    if (!row) {
      logger.warn({ rowId }, 'Row not found for deletion');
      throw new NotFoundError(ERROR_MESSAGES.ROW_NOT_FOUND);
    }

    logger.info({ rowId, userId }, 'Row deleted with image cleanup');
    return this._formatRow(row);
  }

  async deleteRows(rowIds, userId) {
    logger.debug({ rowIds, userId }, 'Bulk delete rows use-case called');
    const isOwner = await this.repository.checkRowsOwnership(rowIds, userId);
    if (!isOwner) {
      logger.warn({ rowIds, userId }, 'Bulk rows ownership check failed');
      throw new NotFoundError(ERROR_MESSAGES.ROW_NOT_FOUND);
    }

    logger.debug({ rowIds }, 'Cleaning up images from rows');
    for (const rowId of rowIds) {
      await this.imageCleanupService.deleteImagesByRowId(rowId);
    }

    const result = await this.repository.deleteRows(rowIds);
    logger.info({ rowIds, userId, deletedCount: result.count }, 'Rows bulk deleted with image cleanup');
    return { deletedCount: result.count };
  }

  _formatRow(row) {
    return {
      id: row.id,
      tableId: row.tableId,
      cells: row.cells
        ? row.cells.map((cell) => ({
          id: cell.id,
          rowId: cell.rowId,
          columnId: cell.columnId,
          columnName: cell.column?.name,
          value: cell.value,
          imageUrl: cell.imageUrl,
          cloudinaryPublicId: cell.cloudinaryPublicId,
          createdAt: cell.createdAt,
          updatedAt: cell.updatedAt,
        }))
        : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export default RowUseCase;
