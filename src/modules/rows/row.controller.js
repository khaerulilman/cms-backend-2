import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../../constants/http.js";
import logger from "../../utils/logger.js";

import RowService from "./row.service.js";

export class RowController {
  constructor() {
    this.service = new RowService();
  }

  async createRow(req, res, next) {
    try {
      const userId = req.user.id;
      const { tableId } = req.body;

      logger.debug({ tableId, userId }, "Create row request received");
      if (!tableId) {
        logger.warn({ userId }, "Create row called without tableId");
        return res.status(400).json({
          success: false,
          message: ERROR_MESSAGES.TABLE_ID_REQUIRED,
        });
      }

      const row = await this.service.createRow(tableId, userId);

      logger.info(
        { rowId: row.id, tableId, userId },
        "Row created successfully",
      );
      return res.status(201).json({
        success: true,
        message: SUCCESS_MESSAGES.ROW_CREATED,
        data: row,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRowsByTable(req, res, next) {
    try {
      const userId = req.user.id;
      const { tableId } = req.params;

      logger.debug({ tableId, userId }, "Get rows by table request received");
      const rows = await this.service.getRowsByTable(tableId, userId);

      logger.info(
        { tableId, userId, rowCount: rows.length },
        "Rows retrieved from table",
      );
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.ROWS_RETRIEVED,
        data: rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRowById(req, res, next) {
    try {
      const userId = req.user.id;
      const { rowId } = req.params;

      logger.debug({ rowId, userId }, "Get row by ID request received");
      const row = await this.service.getRowById(rowId, userId);

      logger.info(
        { rowId, userId, cellCount: row.cells.length },
        "Row retrieved successfully",
      );
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.ROW_RETRIEVED,
        data: row,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRow(req, res, next) {
    try {
      const userId = req.user.id;
      const { rowId } = req.params;
      const data = req.body;

      logger.debug({ rowId, userId }, "Update row request received");
      const updatedRow = await this.service.updateRow(rowId, userId, data);

      logger.info({ rowId, userId }, "Row updated successfully");
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.ROW_UPDATED,
        data: updatedRow,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRow(req, res, next) {
    try {
      const userId = req.user.id;
      const { rowId } = req.params;

      logger.debug({ rowId, userId }, "Delete row request received");
      const deletedRow = await this.service.deleteRow(rowId, userId);

      logger.info({ rowId, userId }, "Row deleted successfully");
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.ROW_DELETED,
        data: deletedRow,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteRows(req, res, next) {
    try {
      const userId = req.user.id;
      const { rowIds } = req.body;

      logger.debug({ rowIds, userId }, "Bulk delete rows request received");
      const result = await this.service.deleteRows(rowIds, userId);

      logger.info(
        { rowIds, userId, deletedCount: result.deletedCount },
        "Rows bulk deleted successfully",
      );
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.ROWS_DELETED,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default RowController;
