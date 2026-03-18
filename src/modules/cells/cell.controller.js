import { HTTP_STATUS, SUCCESS_MESSAGES } from "../../constants/http.js";
import FileUtils from "../../utils/file.js";
import logger from "../../utils/logger.js";

import CellService from "./cell.service.js";

export class CellController {
  constructor() {
    this.service = new CellService();
  }

  async getCellsByRow(req, res, next) {
    try {
      const userId = req.user.id;
      const { rowId } = req.params;

      const cells = await this.service.getCellsByRow(rowId, userId);

      logger.debug(
        { rowId, cellCount: cells.length },
        "Cells retrieved for row",
      );
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.CELLS_RETRIEVED,
        data: cells,
      });
    } catch (error) {
      next(error);
    }
  }

  async upsertCell(req, res, next) {
    try {
      const userId = req.user.id;
      const { rowId } = req.params;
      const { columnId, value } = req.body;
      const imageFile = req.file;

      try {
        const cell = await this.service.upsertCell(
          rowId,
          columnId,
          userId,
          value,
          imageFile,
        );

        // Clean up temporary file after successful upload to Cloudinary
        if (imageFile) {
          await FileUtils.deleteFile(imageFile.path);
        }

        logger.info(
          { rowId, columnId, hasImage: !!imageFile },
          "Cell upserted",
        );
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: SUCCESS_MESSAGES.CELL_UPSERTED,
          data: cell,
        });
      } catch (error) {
        // Clean up file in case of error
        if (imageFile) {
          await FileUtils.deleteFile(imageFile.path);
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
}

export default CellController;
