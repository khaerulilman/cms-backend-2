import prisma from '../../prisma/client.js';
import logger from '../../utils/logger.js';

export class ColumnRepository {
  async createColumns(data) {
    logger.debug({ columnCount: data.length }, 'Creating columns in database');
    // Create multiple columns at once
    const columns = await Promise.all(
      data.map((column) =>
        prisma.cmsColumn.create({
          data: {
            ...column,
          },
          include: {
            table: true,
          },
        }),
      ),
    );
    logger.debug(
      { createdCount: columns.length },
      'Columns created in database',
    );
    return columns;
  }

  async findColumnById(columnId) {
    logger.debug({ columnId }, 'Finding column by ID in database');
    return prisma.cmsColumn.findUnique({
      where: { id: columnId },
      include: {
        table: true,
        cells: true,
      },
    });
  }

  async findColumnsByTableId(tableId) {
    logger.debug({ tableId }, 'Finding columns by table ID in database');
    return prisma.cmsColumn.findMany({
      where: { tableId },
      include: {
        table: true,
        cells: {
          take: 5, // Get first 5 cells as preview
        },
      },
    });
  }

  async updateColumn(columnId, data) {
    logger.debug(
      { columnId, updatingData: data },
      'Updating column in database',
    );
    return prisma.cmsColumn.update({
      where: { id: columnId },
      data,
      include: {
        table: true,
        cells: true,
      },
    });
  }

  async deleteColumn(columnId) {
    logger.debug({ columnId }, 'Deleting column from database');
    return prisma.cmsColumn.delete({
      where: { id: columnId },
    });
  }

  async checkColumnOwnership(columnId, userId) {
    logger.debug({ columnId, userId }, 'Checking column ownership');
    const column = await prisma.cmsColumn.findUnique({
      where: { id: columnId },
      include: {
        table: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!column) {
      logger.warn({ columnId }, 'Column not found for ownership check');
      return false;
    }
    return column.table.project.userId === userId;
  }

  async checkTableOwnership(tableId, userId) {
    logger.debug({ tableId, userId }, 'Checking table ownership');
    const table = await prisma.cmsTable.findUnique({
      where: { id: tableId },
      include: {
        project: true,
      },
    });

    if (!table) {
      logger.warn({ tableId }, 'Table not found for ownership check');
      return false;
    }
    return table.project.userId === userId;
  }
}

export default ColumnRepository;
