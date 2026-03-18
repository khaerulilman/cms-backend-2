import prisma from "../../prisma/client.js";
import logger from "../../utils/logger.js";

export class TableRepository {
  async createTable(data) {
    logger.debug(
      { projectId: data.projectId, tableName: data.name },
      "Creating table in database",
    );
    return prisma.cmsTable.create({
      data,
      include: {
        project: true,
        columns: true,
        rows: true,
      },
    });
  }

  async findTableById(tableId) {
    logger.debug({ tableId }, "Finding table by ID in database");
    return prisma.cmsTable.findUnique({
      where: { id: tableId },
      include: {
        project: true,
        columns: true,
        rows: {
          include: {
            cells: true,
          },
        },
      },
    });
  }

  async findTablesByProjectId(projectId) {
    logger.debug({ projectId }, "Finding tables by project ID in database");
    return prisma.cmsTable.findMany({
      where: { projectId },
      include: {
        columns: true,
        rows: {
          take: 5, // Get first 5 rows as preview
        },
      },
    });
  }

  async updateTable(tableId, data) {
    logger.debug({ tableId, updatingData: data }, "Updating table in database");
    return prisma.cmsTable.update({
      where: { id: tableId },
      data,
      include: {
        project: true,
        columns: true,
        rows: true,
      },
    });
  }

  async deleteTable(tableId) {
    logger.debug({ tableId }, "Deleting table from database");
    return prisma.cmsTable.delete({
      where: { id: tableId },
    });
  }

  // Find all cells for a specific table (for cleanup purposes)
  async findCellsByTableId(tableId) {
    logger.debug({ tableId }, "Finding cells by table ID in database");
    return prisma.cmsCell.findMany({
      where: {
        row: {
          tableId,
        },
      },
      select: {
        id: true,
        cloudinaryPublicId: true,
        imageUrl: true,
      },
    });
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

    const isOwner = table.project.userId === userId;
    if (!isOwner) {
      logger.warn(
        { tableId, userId, ownerId: table.project.userId },
        "User does not own table",
      );
    }

    return isOwner;
  }

  async checkProjectOwnership(projectId, userId) {
    logger.debug({ projectId, userId }, "Checking project ownership");
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      logger.warn({ projectId }, "Project not found for ownership check");
      return false;
    }

    const isOwner = project.userId === userId;
    if (!isOwner) {
      logger.warn(
        { projectId, userId, ownerId: project.userId },
        "User does not own project",
      );
    }

    return isOwner;
  }

  // Helper method to find table by ID within transaction
  async _findTableByIdInTransaction(tableId, tx) {
    return tx.cmsTable.findUnique({
      where: { id: tableId },
      include: {
        project: true,
        columns: true,
        rows: {
          include: {
            cells: true,
          },
        },
      },
    });
  }

  // Duplicate table with all related data (columns, rows, cells)
  // imageMapping: { [originalCellId]: { imageUrl, cloudinaryPublicId } }
  // options: { isSubTable } - override isSubTable value
  async duplicateTable(sourceTableId, imageMapping = {}, options = {}) {
    logger.debug({ sourceTableId }, "Starting table duplication in repository");

    // Get the source table with all related data
    const sourceTable = await this.findTableById(sourceTableId);

    if (!sourceTable) {
      logger.warn({ sourceTableId }, "Source table not found");
      return null;
    }

    // Perform the duplication within a transaction
    return prisma.$transaction(async (tx) => {
      try {
        logger.debug(
          { sourceTableId, sourceTableName: sourceTable.name },
          "Creating duplicate table in transaction",
        );

        // Create the new table (let DB generate UUID)
        const duplicatedTable = await tx.cmsTable.create({
          data: {
            projectId: sourceTable.projectId,
            name: `${sourceTable.name} (Copy)`,
            isSubTable:
              options.isSubTable !== undefined
                ? options.isSubTable
                : sourceTable.isSubTable,
          },
        });

        logger.debug(
          { newTableId: duplicatedTable.id },
          "Duplicated table created, now duplicating columns",
        );

        // Duplicate columns and store mapping
        const columnMapping = {};
        for (const column of sourceTable.columns) {
          const newColumn = await tx.cmsColumn.create({
            data: {
              tableId: duplicatedTable.id,
              name: column.name,
            },
          });
          columnMapping[column.id] = newColumn.id;
        }

        logger.debug(
          {
            newTableId: duplicatedTable.id,
            columnCount: Object.keys(columnMapping).length,
          },
          "Columns duplicated, now duplicating rows",
        );

        // Duplicate rows with cells
        for (const row of sourceTable.rows) {
          const newRow = await tx.cmsRow.create({
            data: {
              tableId: duplicatedTable.id,
            },
          });

          // Duplicate cells for this row
          for (const cell of row.cells) {
            const newColumnId = columnMapping[cell.columnId];
            if (newColumnId) {
              // Use duplicated image data if available, otherwise copy original
              const cellImageData = imageMapping[cell.id] || {
                imageUrl: cell.imageUrl,
                cloudinaryPublicId: cell.cloudinaryPublicId,
              };

              await tx.cmsCell.create({
                data: {
                  rowId: newRow.id,
                  columnId: newColumnId,
                  value: cell.value,
                  imageUrl: cellImageData.imageUrl,
                  cloudinaryPublicId: cellImageData.cloudinaryPublicId,
                },
              });
            }
          }
        }

        logger.info(
          {
            sourceTableId,
            newTableId: duplicatedTable.id,
            tableName: duplicatedTable.name,
          },
          "Table duplicated successfully",
        );

        // Return the new table with all data using tx (transaction client)
        return await this._findTableByIdInTransaction(duplicatedTable.id, tx);
      } catch (error) {
        logger.error(
          { sourceTableId, error: error.message, stack: error.stack },
          "Error during table duplication transaction",
        );
        throw error; // Re-throw to trigger transaction rollback
      }
    });
  }
}

export default TableRepository;
