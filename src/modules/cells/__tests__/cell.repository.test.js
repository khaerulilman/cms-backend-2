import { describe, it, expect, beforeEach, vi } from 'vitest';

import prisma from '../../../prisma/client.js';
import { CellRepository } from '../cell.repository.js';

vi.mock('../../../prisma/client.js', () => ({
  default: {
    cmsCell: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    cmsRow: {
      findUnique: vi.fn(),
    },
  },
}));

describe('CellRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new CellRepository();
    vi.clearAllMocks();
  });

  describe('checkRowOwnership', () => {
    it('should return true when user owns the row', async () => {
      const userId = 'user-123';
      const rowId = 'row-456';

      const mockRow = {
        table: {
          project: {
            userId: 'user-123',
          },
        },
      };

      prisma.cmsRow.findUnique.mockResolvedValue(mockRow);

      const result = await repository.checkRowOwnership(rowId, userId);

      expect(prisma.cmsRow.findUnique).toHaveBeenCalledWith({
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
      expect(result).toBe(true);
    });

    it('should return false when user does not own the row', async () => {
      const userId = 'user-123';
      const rowId = 'row-456';

      const mockRow = {
        table: {
          project: {
            userId: 'different-user-789',
          },
        },
      };

      prisma.cmsRow.findUnique.mockResolvedValue(mockRow);

      const result = await repository.checkRowOwnership(rowId, userId);

      expect(result).toBe(false);
    });

    it('should return false when row does not exist', async () => {
      const userId = 'user-123';
      const rowId = 'non-existent-row';

      prisma.cmsRow.findUnique.mockResolvedValue(null);

      const result = await repository.checkRowOwnership(rowId, userId);

      expect(result).toBe(false);
    });

    it('should handle different user IDs correctly', async () => {
      const userId = 'user-abc-def';
      const rowId = 'row-xyz';

      const mockRow = {
        table: {
          project: {
            userId: 'user-abc-def',
          },
        },
      };

      prisma.cmsRow.findUnique.mockResolvedValue(mockRow);

      const result = await repository.checkRowOwnership(rowId, userId);

      expect(result).toBe(true);
    });
  });

  describe('findCellByRowAndColumn', () => {
    it('should find cell by row and column IDs', async () => {
      const rowId = 'row-123';
      const columnId = 'column-456';

      const mockCell = {
        id: 'cell-789',
        rowId,
        columnId,
        value: 'cell content',
        imageUrl: null,
        cloudinaryPublicId: null,
        column: {
          id: columnId,
          name: 'Column Name',
        },
      };

      prisma.cmsCell.findUnique.mockResolvedValue(mockCell);

      const result = await repository.findCellByRowAndColumn(rowId, columnId);

      expect(prisma.cmsCell.findUnique).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockCell);
    });

    it('should return null when cell does not exist', async () => {
      const rowId = 'row-123';
      const columnId = 'column-456';

      prisma.cmsCell.findUnique.mockResolvedValue(null);

      const result = await repository.findCellByRowAndColumn(rowId, columnId);

      expect(result).toBeNull();
    });

    it('should include column information in result', async () => {
      const rowId = 'row-123';
      const columnId = 'column-456';

      const mockCell = {
        id: 'cell-789',
        rowId,
        columnId,
        value: 'test value',
        imageUrl: 'https://example.com/image.jpg',
        cloudinaryPublicId: 'public-123',
        column: {
          id: columnId,
          name: 'Test Column',
        },
      };

      prisma.cmsCell.findUnique.mockResolvedValue(mockCell);

      const result = await repository.findCellByRowAndColumn(rowId, columnId);

      expect(result.column).toBeDefined();
      expect(result.column.name).toBe('Test Column');
    });
  });

  describe('findCellsByRowId', () => {
    it('should find all cells for a specific row', async () => {
      const rowId = 'row-123';

      const mockCells = [
        {
          id: 'cell-1',
          rowId,
          columnId: 'column-1',
          value: 'content 1',
          imageUrl: null,
          cloudinaryPublicId: null,
          createdAt: new Date('2025-01-15'),
          column: {
            id: 'column-1',
            name: 'Column 1',
          },
        },
        {
          id: 'cell-2',
          rowId,
          columnId: 'column-2',
          value: 'content 2',
          imageUrl: null,
          cloudinaryPublicId: null,
          createdAt: new Date('2025-01-16'),
          column: {
            id: 'column-2',
            name: 'Column 2',
          },
        },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockCells);

      const result = await repository.findCellsByRowId(rowId);

      expect(prisma.cmsCell.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockCells);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no cells found', async () => {
      const rowId = 'row-123';

      prisma.cmsCell.findMany.mockResolvedValue([]);

      const result = await repository.findCellsByRowId(rowId);

      expect(result).toEqual([]);
    });

    it('should order cells by createdAt ascending', async () => {
      const rowId = 'row-123';

      const mockCells = [
        {
          id: 'cell-1',
          rowId,
          columnId: 'column-1',
          value: 'content 1',
          imageUrl: null,
          cloudinaryPublicId: null,
          createdAt: new Date('2025-01-10'),
          column: { id: 'column-1', name: 'Column 1' },
        },
        {
          id: 'cell-2',
          rowId,
          columnId: 'column-2',
          value: 'content 2',
          imageUrl: null,
          cloudinaryPublicId: null,
          createdAt: new Date('2025-01-20'),
          column: { id: 'column-2', name: 'Column 2' },
        },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockCells);

      const result = await repository.findCellsByRowId(rowId);

      expect(result[0].createdAt < result[1].createdAt).toBe(true);
    });

    it('should include column details for each cell', async () => {
      const rowId = 'row-123';

      const mockCells = [
        {
          id: 'cell-1',
          rowId,
          columnId: 'column-1',
          value: 'content 1',
          imageUrl: null,
          cloudinaryPublicId: null,
          createdAt: new Date('2025-01-15'),
          column: {
            id: 'column-1',
            name: 'Column 1',
          },
        },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockCells);

      const result = await repository.findCellsByRowId(rowId);

      expect(result[0].column).toBeDefined();
      expect(result[0].column.name).toBe('Column 1');
    });
  });

  describe('upsertCell', () => {
    it('should create new cell when it does not exist', async () => {
      const rowId = 'row-123';
      const columnId = 'column-456';
      const value = 'new cell value';

      const mockCell = {
        id: expect.any(String),
        rowId,
        columnId,
        value,
        imageUrl: null,
        cloudinaryPublicId: null,
        column: {
          id: columnId,
          name: 'Column Name',
        },
      };

      prisma.cmsCell.upsert.mockResolvedValue(mockCell);

      const result = await repository.upsertCell(rowId, columnId, value);

      expect(prisma.cmsCell.upsert).toHaveBeenCalledWith({
        where: {
          rowId_columnId: {
            rowId,
            columnId,
          },
        },
        update: {
          value,
          imageUrl: null,
          cloudinaryPublicId: null,
        },
        create: {
          id: expect.any(String),
          rowId,
          columnId,
          value,
          imageUrl: null,
          cloudinaryPublicId: null,
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
      expect(result).toEqual(mockCell);
    });

    it('should update existing cell', async () => {
      const rowId = 'row-123';
      const columnId = 'column-456';
      const updatedValue = 'updated cell value';

      const mockCell = {
        id: 'cell-789',
        rowId,
        columnId,
        value: updatedValue,
        imageUrl: null,
        cloudinaryPublicId: null,
        column: {
          id: columnId,
          name: 'Column Name',
        },
      };

      prisma.cmsCell.upsert.mockResolvedValue(mockCell);

      const result = await repository.upsertCell(rowId, columnId, updatedValue);

      expect(result.value).toBe(updatedValue);
    });

    it('should upsert cell with image URL and cloudinary public ID', async () => {
      const rowId = 'row-123';
      const columnId = 'column-456';
      const value = 'cell with image';
      const imageUrl = 'https://example.com/image.jpg';
      const cloudinaryPublicId = 'public-id-123';

      const mockCell = {
        id: 'cell-789',
        rowId,
        columnId,
        value,
        imageUrl,
        cloudinaryPublicId,
        column: {
          id: columnId,
          name: 'Column Name',
        },
      };

      prisma.cmsCell.upsert.mockResolvedValue(mockCell);

      const result = await repository.upsertCell(
        rowId,
        columnId,
        value,
        imageUrl,
        cloudinaryPublicId,
      );

      expect(prisma.cmsCell.upsert).toHaveBeenCalledWith({
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
          id: expect.any(String),
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
      expect(result.imageUrl).toBe(imageUrl);
      expect(result.cloudinaryPublicId).toBe(cloudinaryPublicId);
    });

    it('should generate unique ID for new cell', async () => {
      const rowId = 'row-123';
      const columnId = 'column-456';
      const value = 'cell content';

      const mockCell = {
        id: 'generated-uuid-123',
        rowId,
        columnId,
        value,
        imageUrl: null,
        cloudinaryPublicId: null,
        column: {
          id: columnId,
          name: 'Column Name',
        },
      };

      prisma.cmsCell.upsert.mockResolvedValue(mockCell);

      const result = await repository.upsertCell(rowId, columnId, value);

      expect(result.id).toBeDefined();
    });

    it('should upsert cell with null value', async () => {
      const rowId = 'row-123';
      const columnId = 'column-456';

      const mockCell = {
        id: 'cell-789',
        rowId,
        columnId,
        value: null,
        imageUrl: null,
        cloudinaryPublicId: null,
        column: {
          id: columnId,
          name: 'Column Name',
        },
      };

      prisma.cmsCell.upsert.mockResolvedValue(mockCell);

      const result = await repository.upsertCell(rowId, columnId, null);

      expect(result.value).toBeNull();
    });

    it('should include column information in result', async () => {
      const rowId = 'row-123';
      const columnId = 'column-456';
      const value = 'cell content';

      const mockCell = {
        id: 'cell-789',
        rowId,
        columnId,
        value,
        imageUrl: null,
        cloudinaryPublicId: null,
        column: {
          id: columnId,
          name: 'Important Column',
        },
      };

      prisma.cmsCell.upsert.mockResolvedValue(mockCell);

      const result = await repository.upsertCell(rowId, columnId, value);

      expect(result.column).toBeDefined();
      expect(result.column.name).toBe('Important Column');
    });
  });
});
