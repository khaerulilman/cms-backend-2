import crypto from 'crypto';

import logger from '../../frameworks/logging/logger.js';

export class CellRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // Check if user owns the row (indirectly through project -> table -> row)
  async checkRowOwnership(rowId, userId) {
    const row = await this.prisma.cmsRow.findUnique({
      where: { id: rowId },
      select: {
        table: {
          select: {
            project: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!row) {
      return false;
    }

    return row.table.project.userId === userId;
  }

  // Find cell by row and column
  async findCellByRowAndColumn(rowId, columnId) {
    const cell = await this.prisma.cmsCell.findUnique({
      where: {
        rowId_columnId: {
          rowId,
          columnId,
        },
      },
      include: {
        column: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return cell;
  }

  // Find all cells for a specific row
  async findCellsByRowId(rowId) {
    const cells = await this.prisma.cmsCell.findMany({
      where: { rowId },
      include: {
        column: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return cells;
  }

  // Upsert cell (update if exists, create if not)
  async upsertCell(
    rowId,
    columnId,
    value,
    imageUrl = null,
    cloudinaryPublicId = null,
  ) {
    logger.debug({ rowId, columnId }, 'Upserting cell in database');
    const cell = await this.prisma.cmsCell.upsert({
      where: {
        rowId_columnId: {
          rowId,
          columnId,
        },
      },
      update: {
        value,
        imageUrl,
        cloudinaryPublicId,
      },
      create: {
        id: crypto.randomUUID(),
        rowId,
        columnId,
        value,
        imageUrl,
        cloudinaryPublicId,
      },
      include: {
        column: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return cell;
  }
}

export default CellRepository;
