import prisma from "../../prisma/client.js";
import logger from "../../utils/logger.js";

export class RowRepository {
  async createRow(data) {
    logger.debug({ tableId: data.tableId }, "Creating row in database");
    return prisma.cmsRow.create({
      data,
      include: {
        table: true,
        cells: {
          include: {
            column: true,
          },
        },
      },
    });
  }

  async findRowById(rowId) {
    logger.debug({ rowId }, "Finding row by ID in database");
    return prisma.cmsRow.findUnique({
      where: { id: rowId },
      include: {
        table: true,
        cells: {
          include: {
            column: true,
          },
        },
      },
    });
  }

  async findRowsByTableId(tableId) {
    logger.debug({ tableId }, "Finding rows by table ID in database");
    return prisma.cmsRow.findMany({
      where: { tableId },
      include: {
        table: true,
        cells: {
          include: {
            column: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateRow(rowId, data) {
    logger.debug({ rowId, updatingData: data }, "Updating row in database");
    return prisma.cmsRow.update({
      where: { id: rowId },
      data,
      include: {
        table: true,
        cells: {
          include: {
            column: true,
          },
        },
      },
    });
  }

  async deleteRow(rowId) {
    logger.debug({ rowId }, "Deleting row from database");
    return prisma.cmsRow.delete({
      where: { id: rowId },
    });
  }

  async deleteRows(rowIds) {
    logger.debug(
      { rowIds, count: rowIds.length },
      "Bulk deleting rows from database",
    );
    return prisma.cmsRow.deleteMany({
      where: { id: { in: rowIds } },
    });
  }

  // Find all cells for a specific row (for cleanup purposes)
  async findCellsByRowId(rowId) {
    logger.debug({ rowId }, "Finding cells by row ID in database");
    return prisma.cmsCell.findMany({
      where: { rowId },
      select: {
        id: true,
        cloudinaryPublicId: true,
        imageUrl: true,
      },
    });
  }

  async checkRowOwnership(rowId, userId) {
    logger.debug({ rowId, userId }, "Checking row ownership");
    const row = await prisma.cmsRow.findUnique({
      where: { id: rowId },
      include: {
        table: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!row) {
      logger.warn({ rowId }, "Row not found for ownership check");
      return false;
    }
    return row.table.project.userId === userId;
  }

  async checkRowsOwnership(rowIds, userId) {
    logger.debug({ rowIds, userId }, "Checking bulk rows ownership");
    const rows = await prisma.cmsRow.findMany({
      where: { id: { in: rowIds } },
      include: {
        table: {
          include: {
            project: true,
          },
        },
      },
    });

    if (rows.length !== rowIds.length) {
      logger.warn(
        { expected: rowIds.length, found: rows.length },
        "Some rows not found for ownership check",
      );
      return false;
    }
    return rows.every((row) => row.table.project.userId === userId);
  }

  async checkTableOwnership(tableId, userId) {
    logger.debug({ tableId, userId }, "Checking table ownership");
    const table = await prisma.cmsTable.findUnique({
      where: { id: tableId },
      include: {
        project: true,
      },
    });

    if (!table) {
      logger.warn({ tableId }, "Table not found for ownership check");
      return false;
    }
    return table.project.userId === userId;
  }
}

export default RowRepository;
