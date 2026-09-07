import {
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from '../../entities/constants/http.js';
import logger from '../../frameworks/logging/logger.js';

export class ColumnController {

  constructor({ columnUseCase }) {
    this.useCase = columnUseCase;
  }

  async createColumns(req, res, next) {
    try {
      const userId = req.user.id;
      const { tableId, columns } = req.body;
      logger.debug({ tableId, columnCount: columns?.length }, 'Create columns request received');

      const createdColumns = await this.useCase.createColumns(tableId, userId, columns);

      logger.info({ tableId, userId, createdCount: createdColumns.length }, 'Columns created successfully');
      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.COLUMNS_CREATED,
        data: createdColumns,
      });
    } catch (error) {
      next(error);
    }
  }

  async getColumnsByTable(req, res, next) {
    try {
      const userId = req.user.id;
      const { tableId } = req.params;
      logger.debug({ tableId, userId }, 'Get columns by table request received');
      const columns = await this.useCase.getColumnsByTable(tableId, userId);

      logger.info({ tableId, columnCount: columns.length }, 'Columns retrieved successfully');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.COLUMNS_RETRIEVED,
        data: columns,
      });
    } catch (error) {
      next(error);
    }
  }

  async getColumnById(req, res, next) {
    try {
      const userId = req.user.id;
      const { columnId } = req.params;
      logger.debug({ columnId, userId }, 'Get column by ID request received');
      const column = await this.useCase.getColumnById(columnId, userId);

      logger.info({ columnId, columnName: column.name }, 'Column retrieved successfully');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.COLUMN_RETRIEVED,
        data: column,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateColumn(req, res, next) {
    try {
      const userId = req.user.id;
      const { columnId } = req.params;
      const { name } = req.body;
      logger.debug({ columnId, newName: name }, 'Update column request received');

      const updatedColumn = await this.useCase.updateColumn(columnId, userId, { name });

      logger.info({ columnId, userId, newName: updatedColumn.name }, 'Column updated successfully');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.COLUMN_UPDATED,
        data: updatedColumn,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteColumn(req, res, next) {
    try {
      const userId = req.user.id;
      const { columnId } = req.params;
      logger.debug({ columnId, userId }, 'Delete column request received');
      const deletedColumn = await this.useCase.deleteColumn(columnId, userId);

      logger.info({ columnId, userId, deletedName: deletedColumn.name }, 'Column deleted successfully');
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.COLUMN_DELETED,
        data: deletedColumn,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ColumnController;

