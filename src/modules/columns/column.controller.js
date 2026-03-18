import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../../constants/http.js';
import logger from '../../utils/logger.js';

import ColumnService from './column.service.js';
import columnValidationSchemas from './column.validation.js';

export class ColumnController {
  constructor() {
    this.service = new ColumnService();
  }

  async createColumns(req, res, next) {
    try {
      const userId = req.user.id;
      const { tableId, columns } = req.body;

      logger.debug(
        { tableId, columnCount: columns?.length },
        'Create columns request received',
      );
      // Validate input
      const { error, value } = columnValidationSchemas.createColumns.validate(
        { tableId, columns },
        { abortEarly: false },
      );

      if (error) {
        logger.warn(
          { tableId, errorCount: error.details?.length },
          'Column validation failed',
        );
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          errors: error.details.map((err) => ({
            field: err.path[0],
            message: err.message,
          })),
        });
      }

      const createdColumns = await this.service.createColumns(
        value.tableId,
        userId,
        value.columns,
      );

      logger.info(
        { tableId, userId, createdCount: createdColumns.length },
        'Columns created successfully',
      );
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

      logger.debug(
        { tableId, userId },
        'Get columns by table request received',
      );
      const columns = await this.service.getColumnsByTable(tableId, userId);

      logger.info(
        { tableId, columnCount: columns.length },
        'Columns retrieved successfully',
      );
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
      const column = await this.service.getColumnById(columnId, userId);

      logger.info(
        { columnId, columnName: column.name },
        'Column retrieved successfully',
      );
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

      logger.debug(
        { columnId, newName: name },
        'Update column request received',
      );
      // Validate input
      const { error, value } = columnValidationSchemas.updateColumn.validate(
        { name },
        { abortEarly: false },
      );

      if (error) {
        logger.warn(
          { columnId, errorCount: error.details?.length },
          'Column validation failed',
        );
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          errors: error.details.map((err) => ({
            field: err.path[0],
            message: err.message,
          })),
        });
      }

      const updatedColumn = await this.service.updateColumn(
        columnId,
        userId,
        value,
      );

      logger.info(
        { columnId, userId, newName: updatedColumn.name },
        'Column updated successfully',
      );
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
      const deletedColumn = await this.service.deleteColumn(columnId, userId);

      logger.info(
        { columnId, userId, deletedName: deletedColumn.name },
        'Column deleted successfully',
      );
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
