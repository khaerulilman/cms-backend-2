import logger from '../../frameworks/logging/logger.js';
import tableValidationSchemas from '../services/validation/table.validation.js';

export class TableController {

  constructor({ tableUseCase }) {
    this.useCase = tableUseCase;
  }

  async createTable(req, res, next) {
    try {
      const userId = req.user.id;
      const { projectId, name, isSubTable } = req.body;
      logger.debug({ projectId, userId, tableName: name }, 'Create table request received');
      const table = await this.useCase.createTable(projectId, userId, { name, isSubTable });

      logger.info({ tableId: table.id, projectId, userId }, 'Table created successfully');
      return res.status(201).json({ success: true, message: 'Table created successfully', data: table });
    } catch (error) {
      next(error);
    }
  }

  async getUserTablesByProject(req, res, next) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      logger.debug({ projectId, userId }, 'Get tables by project request received');
      const tables = await this.useCase.getUserTablesByProject(projectId, userId);

      logger.info({ projectId, tableCount: tables.length }, 'Tables retrieved successfully');
      return res.status(200).json({ success: true, message: 'Tables retrieved successfully', data: tables });
    } catch (error) {
      next(error);
    }
  }

  async getTableById(req, res, next) {
    try {
      const userId = req.user.id;
      const { tableId } = req.params;
      logger.debug({ tableId, userId }, 'Get table by ID request received');
      const table = await this.useCase.getTableById(tableId, userId);

      logger.info({ tableId, userId, tableName: table.name }, 'Table retrieved successfully');
      return res.status(200).json({ success: true, message: 'Table retrieved successfully', data: table });
    } catch (error) {
      next(error);
    }
  }

  async updateTable(req, res, next) {
    try {
      const userId = req.user.id;
      const { tableId } = req.params;
      const { name, isSubTable } = req.body;
      logger.debug({ tableId, userId, newName: name }, 'Update table request received');
      const table = await this.useCase.updateTable(tableId, userId, { name, isSubTable });

      logger.info({ tableId, userId, newName: table.name }, 'Table updated successfully');
      return res.status(200).json({ success: true, message: 'Table updated successfully', data: table });
    } catch (error) {
      next(error);
    }
  }

  async deleteTable(req, res, next) {
    try {
      const userId = req.user.id;
      const { tableId } = req.params;
      logger.debug({ tableId, userId }, 'Delete table request received');
      await this.useCase.deleteTable(tableId, userId);

      logger.info({ tableId, userId }, 'Table deleted successfully');
      return res.status(200).json({ success: true, message: 'Table deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getTableSimplified(req, res, next) {
    try {
      const userId = req.user.id;
      const { tableId } = req.params;
      logger.debug({ tableId, userId }, 'Get table simplified request received');
      const table = await this.useCase.getTableSimplified(tableId, userId);

      logger.info({ tableId, userId, rowCount: table.cells.length }, 'Table simplified retrieved successfully');
      return res.status(200).json({ success: true, message: 'Table retrieved successfully', data: table });
    } catch (error) {
      next(error);
    }
  }

  async duplicateTable(req, res, next) {
    try {
      const userId = req.user.id;
      const { tableId } = req.params;
      const { isSubTable } = req.body;
      logger.debug({ tableId, userId, isSubTable }, 'Duplicate table request received');

      const { error, value } = tableValidationSchemas.duplicateTable.validate(
        { tableId },
        { abortEarly: false },
      );

      if (error) {
        logger.warn({ tableId, errorCount: error.details?.length }, 'Table validation failed for duplicate');
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((err) => ({ field: err.path[0], message: err.message })),
        });
      }

      const duplicatedTable = await this.useCase.duplicateTable(value.tableId, userId, { isSubTable });

      logger.info({
        sourceTableId: value.tableId,
        newTableId: duplicatedTable.id,
        newTableName: duplicatedTable.name,
        userId,
      }, 'Table duplicated successfully');
      return res.status(201).json({ success: true, message: 'Table duplicated successfully', data: duplicatedTable });
    } catch (error) {
      next(error);
    }
  }
}

export default TableController;
