import { v4 as uuidv4 } from 'uuid';

import { ValidationError, TableNotFoundError } from '../../entities/errors/index.js';
import logger from '../../frameworks/logging/logger.js';

export class TableUseCase {
  /**
   * @param {object} deps
   * @param {import('../../adapters/repositories/table.repository.js').TableRepository} deps.tableRepository
   * @param {import('../../adapters/services/cloudinary.service.js').CloudinaryService} deps.cloudinaryService
   * @param {import('../../adapters/services/imageCleanup.service.js').ImageCleanupService} deps.imageCleanupService
   */
  constructor({ tableRepository, cloudinaryService, imageCleanupService }) {
    this.repository = tableRepository;
    this.cloudinaryService = cloudinaryService;
    this.imageCleanupService = imageCleanupService;
  }

  async createTable(projectId, userId, data) {
    logger.debug({ projectId, userId, tableName: data.name }, 'Create table use-case called');
    if (!data.name || data.name.trim() === '') {
      logger.warn({ projectId, userId }, 'Table name is required');
      throw new ValidationError('Table name is required');
    }

    const isProjectOwner = await this.repository.checkProjectOwnership(projectId, userId);
    if (!isProjectOwner) {
      logger.warn({ projectId, userId }, 'Project ownership check failed');
      throw new TableNotFoundError('Project not found');
    }

    const table = await this.repository.createTable({
      id: uuidv4(),
      projectId,
      name: data.name.trim(),
      isSubTable: data.isSubTable ?? false,
    });

    logger.info({ tableId: table.id, projectId }, 'Table created');
    return this._formatTable(table);
  }

  async getUserTablesByProject(projectId, userId) {
    logger.debug({ projectId, userId }, 'Get user tables by project use-case called');
    const isProjectOwner = await this.repository.checkProjectOwnership(projectId, userId);
    if (!isProjectOwner) {
      logger.warn({ projectId, userId }, 'Project ownership check failed');
      throw new TableNotFoundError('Project not found');
    }

    const tables = await this.repository.findTablesByProjectId(projectId);
    logger.info({ projectId, tableCount: tables.length }, 'Tables retrieved from project');
    return tables.map((table) => this._formatTable(table));
  }

  async getTableById(tableId, userId) {
    logger.debug({ tableId, userId }, 'Get table by ID use-case called');
    const table = await this.repository.findTableById(tableId);

    if (!table) {
      logger.warn({ tableId }, 'Table not found in database');
      throw new TableNotFoundError('Table not found');
    }

    if (table.project.userId !== userId) {
      logger.warn({ tableId, userId, ownerId: table.project.userId }, 'Table ownership check failed');
      throw new TableNotFoundError('Table not found');
    }

    logger.info({ tableId, userId, tableName: table.name }, 'Table retrieved by ID');
    return this._formatTableWithFullData(table);
  }

  async updateTable(tableId, userId, data) {
    logger.debug({ tableId, userId, newName: data.name }, 'Update table use-case called');
    const isOwner = await this.repository.checkTableOwnership(tableId, userId);
    if (!isOwner) {
      logger.warn({ tableId, userId }, 'Table ownership check failed');
      throw new TableNotFoundError('Table not found');
    }

    if (data.name && data.name.trim() === '') {
      logger.warn({ tableId, userId }, 'Table name is empty for update');
      throw new ValidationError('Table name cannot be empty');
    }

    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.isSubTable !== undefined) updateData.isSubTable = data.isSubTable;

    const table = await this.repository.updateTable(tableId, updateData);
    logger.info({ tableId, userId, newName: table.name }, 'Table updated');
    return this._formatTable(table);
  }

  async deleteTable(tableId, userId) {
    logger.debug({ tableId, userId }, 'Delete table use-case called');
    const isOwner = await this.repository.checkTableOwnership(tableId, userId);
    if (!isOwner) {
      logger.warn({ tableId, userId }, 'Table ownership check failed');
      throw new TableNotFoundError('Table not found');
    }

    logger.debug({ tableId }, 'Cleaning up images from table');
    await this.imageCleanupService.deleteImagesByTableId(tableId);

    await this.repository.deleteTable(tableId);
    logger.info({ tableId, userId }, 'Table deleted with image cleanup');
  }

  async getTableSimplified(tableId, userId) {
    logger.debug({ tableId, userId }, 'Get table simplified use-case called');
    const table = await this.repository.findTableById(tableId);

    if (!table) {
      logger.warn({ tableId }, 'Table not found in database');
      throw new TableNotFoundError('Table not found');
    }

    if (table.project.userId !== userId) {
      logger.warn({ tableId, userId, ownerId: table.project.userId }, 'Table ownership check failed');
      throw new TableNotFoundError('Table not found');
    }

    logger.debug({ tableId }, 'Resolving table references');
    return this._formatTableSimplifiedWithResolution(table, userId, new Set());
  }

  async duplicateTable(tableId, userId, options = {}) {
    const { isSubTable } = options;
    logger.debug({ tableId, userId, isSubTable }, 'Duplicate table use-case called');

    const isOwner = await this.repository.checkTableOwnership(tableId, userId);
    if (!isOwner) {
      logger.warn({ tableId, userId }, 'Table ownership check failed');
      throw new TableNotFoundError('Table not found');
    }

    const sourceTable = await this.repository.findTableById(tableId);
    if (!sourceTable) {
      logger.warn({ tableId }, 'Source table not found');
      throw new TableNotFoundError('Table not found');
    }

    const imageMapping = {};
    const duplicatedImagePublicIds = [];
    try {
      for (const row of sourceTable.rows || []) {
        for (const cell of row.cells || []) {
          if (cell.imageUrl && cell.cloudinaryPublicId) {
            const newImage = await this.cloudinaryService.duplicateImage(cell.imageUrl);
            imageMapping[cell.id] = {
              imageUrl: newImage.imageUrl,
              cloudinaryPublicId: newImage.publicId,
            };
            duplicatedImagePublicIds.push(newImage.publicId);
          }
        }
      }
    } catch (imageError) {
      logger.error({ error: imageError.message }, 'Failed to duplicate images, cleaning up');
      if (duplicatedImagePublicIds.length > 0) {
        try {
          await this.cloudinaryService.deleteImages(duplicatedImagePublicIds);
        } catch (cleanupError) {
          logger.error({ error: cleanupError.message }, 'Failed to cleanup duplicated images');
        }
      }
      throw new ValidationError(`Failed to duplicate table images: ${imageError.message}`);
    }

    let duplicatedTable;
    try {
      duplicatedTable = await this.repository.duplicateTable(tableId, imageMapping, { isSubTable });
    } catch (error) {
      logger.error({ tableId, error: error.message }, 'Error during table duplication');
      if (duplicatedImagePublicIds.length > 0) {
        try {
          await this.cloudinaryService.deleteImages(duplicatedImagePublicIds);
        } catch (cleanupError) {
          logger.error({ error: cleanupError.message }, 'Failed to cleanup duplicated images after DB failure');
        }
      }
      throw new ValidationError(`Failed to duplicate table: ${error.message}`);
    }

    if (!duplicatedTable) {
      logger.error({ tableId }, 'Table duplication returned null');
      throw new ValidationError('Failed to duplicate table - no result returned');
    }

    logger.info({ sourceTableId: tableId, newTableId: duplicatedTable.id }, 'Table duplicated successfully');
    return this._formatTableWithFullData(duplicatedTable);
  }

  _isValidUUID(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return typeof value === 'string' && uuidRegex.test(value);
  }

  async _resolveTableReference(value, userId, visitedTableIds = new Set()) {
    if (!this._isValidUUID(value)) return value;
    if (visitedTableIds.has(value)) {
      logger.debug({ tableId: value }, 'Circular reference detected, returning original value');
      return value;
    }

    try {
      const referencedTable = await this.repository.findTableById(value);
      if (!referencedTable) return value;
      if (referencedTable.project.userId !== userId) {
        logger.warn({ tableId: value, userId }, 'User does not own referenced table');
        return value;
      }
      visitedTableIds.add(value);
      return this._formatTableSimplifiedWithResolution(referencedTable, userId, visitedTableIds);
    } catch (error) {
      logger.error({ tableId: value, error: error.message }, 'Error resolving table reference');
      return value;
    }
  }

  _formatTable(table) {
    return {
      id: table.id,
      projectId: table.projectId,
      name: table.name,
      isSubTable: table.isSubTable,
      columnCount: table.columns ? table.columns.length : 0,
      rowCount: table.rows ? table.rows.length : 0,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  }

  _formatTableWithFullData(table) {
    return {
      id: table.id,
      projectId: table.projectId,
      name: table.name,
      isSubTable: table.isSubTable,
      columns: table.columns.map((col) => ({
        id: col.id,
        name: col.name,
        createdAt: col.createdAt,
        updatedAt: col.updatedAt,
      })),
      rows: table.rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        cells: row.cells.map((cell) => ({
          id: cell.id,
          columnId: cell.columnId,
          value: cell.value,
          createdAt: cell.createdAt,
          updatedAt: cell.updatedAt,
        })),
      })),
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  }

  _formatTableSimplified(table) {
    const normalizeKey = (name) => name.trim().toLowerCase().replace(/\s+/g, '_');
    const cellsByRow = table.rows.map((row) => {
      const rowData = {};
      row.cells.forEach((cell) => {
        const column = table.columns.find((col) => col.id === cell.columnId);
        if (column) {
          rowData[normalizeKey(column.name)] = cell.imageUrl || cell.value;
        }
      });
      return rowData;
    });
    return { name: table.name, cells: cellsByRow };
  }

  async _formatTableSimplifiedWithResolution(table, userId, visitedTableIds = new Set()) {
    logger.debug({ tableId: table.id, rowCount: table.rows.length }, 'Formatting table with reference resolution');
    const normalizeKey = (name) => name.trim().toLowerCase().replace(/\s+/g, '_');

    const cellsByRow = await Promise.all(
      table.rows.map(async (row) => {
        const rowData = {};
        await Promise.all(
          row.cells.map(async (cell) => {
            const column = table.columns.find((col) => col.id === cell.columnId);
            if (column) {
              const key = normalizeKey(column.name);
              const cellValue = cell.imageUrl || cell.value;
              rowData[key] = await this._resolveTableReference(cellValue, userId, visitedTableIds);
            }
          }),
        );
        return rowData;
      }),
    );

    logger.info({ tableId: table.id, rowCount: cellsByRow.length }, 'Table formatted successfully');
    return { name: table.name, cells: cellsByRow };
  }
}

export default TableUseCase;
