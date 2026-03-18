import { describe, it, expect, beforeEach, vi } from 'vitest';

import prisma from '../../../prisma/client.js';
import { RowRepository } from '../row.repository.js';

vi.mock('../../../prisma/client.js', () => ({
  default: {
    cmsRow: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cmsCell: {
      findMany: vi.fn(),
    },
    cmsTable: {
      findUnique: vi.fn(),
    },
  },
}));

describe('RowRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new RowRepository();
    vi.clearAllMocks();
  });

  describe('createRow', () => {
    it('should create a new row with table and cells included', async () => {
      // Arrange - mock data untuk return value (bukan expected)
      const inputData = {
        id: 'row-123',
        tableId: 'table-456',
      };

      const mockCreatedRow = {
        id: 'row-123',
        tableId: 'table-456',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
        table: {
          id: 'table-456',
          name: 'Test Table',
        },
        cells: [],
      };

      prisma.cmsRow.create.mockResolvedValue(mockCreatedRow);

      // Act
      const result = await repository.createRow(inputData);

      // Assert - verifikasi fungsi mock dipanggil dengan benar
      expect(prisma.cmsRow.create).toHaveBeenCalledWith({
        data: inputData,
        include: {
          table: true,
          cells: {
            include: {
              column: true,
            },
          },
        },
      });
      expect(result).toEqual(mockCreatedRow);
    });
  });

  describe('findRowById', () => {
    it('should return row when found by id', async () => {
      // Arrange
      const rowId = 'row-123';
      const mockRow = {
        id: 'row-123',
        tableId: 'table-456',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
        table: {
          id: 'table-456',
          name: 'Test Table',
        },
        cells: [
          {
            id: 'cell-1',
            rowId: 'row-123',
            columnId: 'col-1',
            value: 'Cell Value',
            column: { id: 'col-1', name: 'Column 1' },
          },
        ],
      };

      prisma.cmsRow.findUnique.mockResolvedValue(mockRow);

      // Act
      const result = await repository.findRowById(rowId);

      // Assert
      expect(prisma.cmsRow.findUnique).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockRow);
    });

    it('should return null if row not found', async () => {
      // Arrange
      const rowId = 'non-existent-row';
      prisma.cmsRow.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findRowById(rowId);

      // Assert
      expect(prisma.cmsRow.findUnique).toHaveBeenCalledWith({
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
      expect(result).toBeNull();
    });
  });

  describe('findRowsByTableId', () => {
    it('should return rows for a given table id ordered by createdAt desc', async () => {
      // Arrange
      const tableId = 'table-456';
      const mockRows = [
        {
          id: 'row-2',
          tableId: 'table-456',
          createdAt: new Date('2026-01-16'),
          updatedAt: new Date('2026-01-16'),
          table: { id: 'table-456', name: 'Test Table' },
          cells: [],
        },
        {
          id: 'row-1',
          tableId: 'table-456',
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
          table: { id: 'table-456', name: 'Test Table' },
          cells: [],
        },
      ];

      prisma.cmsRow.findMany.mockResolvedValue(mockRows);

      // Act
      const result = await repository.findRowsByTableId(tableId);

      // Assert
      expect(prisma.cmsRow.findMany).toHaveBeenCalledWith({
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
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockRows);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no rows found', async () => {
      // Arrange
      const tableId = 'table-empty';
      prisma.cmsRow.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findRowsByTableId(tableId);

      // Assert
      expect(prisma.cmsRow.findMany).toHaveBeenCalledWith({
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
          createdAt: 'desc',
        },
      });
      expect(result).toEqual([]);
    });
  });

  describe('updateRow', () => {
    it('should update row and return updated data', async () => {
      // Arrange
      const rowId = 'row-123';
      const updateData = { updatedAt: new Date('2026-01-20') };

      const mockUpdatedRow = {
        id: 'row-123',
        tableId: 'table-456',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-20'),
        table: { id: 'table-456', name: 'Test Table' },
        cells: [],
      };

      prisma.cmsRow.update.mockResolvedValue(mockUpdatedRow);

      // Act
      const result = await repository.updateRow(rowId, updateData);

      // Assert
      expect(prisma.cmsRow.update).toHaveBeenCalledWith({
        where: { id: rowId },
        data: updateData,
        include: {
          table: true,
          cells: {
            include: {
              column: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUpdatedRow);
    });
  });

  describe('deleteRow', () => {
    it('should delete row and return deleted row', async () => {
      // Arrange
      const rowId = 'row-123';

      const mockDeletedRow = {
        id: 'row-123',
        tableId: 'table-456',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      };

      prisma.cmsRow.delete.mockResolvedValue(mockDeletedRow);

      // Act
      const result = await repository.deleteRow(rowId);

      // Assert
      expect(prisma.cmsRow.delete).toHaveBeenCalledWith({
        where: { id: rowId },
      });
      expect(result).toEqual(mockDeletedRow);
    });
  });

  describe('findCellsByRowId', () => {
    it('should return cells with cloudinary info for cleanup', async () => {
      // Arrange
      const rowId = 'row-123';
      const mockCells = [
        {
          id: 'cell-1',
          cloudinaryPublicId: 'public-id-1',
          imageUrl: 'https://cloudinary.com/image1.jpg',
        },
        {
          id: 'cell-2',
          cloudinaryPublicId: null,
          imageUrl: null,
        },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockCells);

      // Act
      const result = await repository.findCellsByRowId(rowId);

      // Assert
      expect(prisma.cmsCell.findMany).toHaveBeenCalledWith({
        where: { rowId },
        select: {
          id: true,
          cloudinaryPublicId: true,
          imageUrl: true,
        },
      });
      expect(result).toEqual(mockCells);
    });
  });

  describe('checkRowOwnership', () => {
    it('should return true if user owns the row', async () => {
      // Arrange
      const rowId = 'row-123';
      const userId = 'user-789';

      const mockRow = {
        id: 'row-123',
        table: {
          id: 'table-456',
          project: {
            id: 'project-111',
            userId: 'user-789',
          },
        },
      };

      prisma.cmsRow.findUnique.mockResolvedValue(mockRow);

      // Act
      const result = await repository.checkRowOwnership(rowId, userId);

      // Assert
      expect(prisma.cmsRow.findUnique).toHaveBeenCalledWith({
        where: { id: rowId },
        include: {
          table: {
            include: {
              project: true,
            },
          },
        },
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not own the row', async () => {
      // Arrange
      const rowId = 'row-123';
      const userId = 'other-user';

      const mockRow = {
        id: 'row-123',
        table: {
          id: 'table-456',
          project: {
            id: 'project-111',
            userId: 'user-789',
          },
        },
      };

      prisma.cmsRow.findUnique.mockResolvedValue(mockRow);

      // Act
      const result = await repository.checkRowOwnership(rowId, userId);

      // Assert
      expect(prisma.cmsRow.findUnique).toHaveBeenCalledWith({
        where: { id: rowId },
        include: {
          table: {
            include: {
              project: true,
            },
          },
        },
      });
      expect(result).toBe(false);
    });

    it('should return false if row not found', async () => {
      // Arrange
      const rowId = 'non-existent-row';
      const userId = 'user-789';

      prisma.cmsRow.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.checkRowOwnership(rowId, userId);

      // Assert
      expect(prisma.cmsRow.findUnique).toHaveBeenCalledWith({
        where: { id: rowId },
        include: {
          table: {
            include: {
              project: true,
            },
          },
        },
      });
      expect(result).toBe(false);
    });
  });

  describe('checkTableOwnership', () => {
    it('should return true if user owns the table', async () => {
      // Arrange
      const tableId = 'table-456';
      const userId = 'user-789';

      const mockTable = {
        id: 'table-456',
        project: {
          id: 'project-111',
          userId: 'user-789',
        },
      };

      prisma.cmsTable.findUnique.mockResolvedValue(mockTable);

      // Act
      const result = await repository.checkTableOwnership(tableId, userId);

      // Assert
      expect(prisma.cmsTable.findUnique).toHaveBeenCalledWith({
        where: { id: tableId },
        include: {
          project: true,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not own the table', async () => {
      // Arrange
      const tableId = 'table-456';
      const userId = 'other-user';

      const mockTable = {
        id: 'table-456',
        project: {
          id: 'project-111',
          userId: 'user-789',
        },
      };

      prisma.cmsTable.findUnique.mockResolvedValue(mockTable);

      // Act
      const result = await repository.checkTableOwnership(tableId, userId);

      // Assert
      expect(prisma.cmsTable.findUnique).toHaveBeenCalledWith({
        where: { id: tableId },
        include: {
          project: true,
        },
      });
      expect(result).toBe(false);
    });

    it('should return false if table not found', async () => {
      // Arrange
      const tableId = 'non-existent-table';
      const userId = 'user-789';

      prisma.cmsTable.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.checkTableOwnership(tableId, userId);

      // Assert
      expect(prisma.cmsTable.findUnique).toHaveBeenCalledWith({
        where: { id: tableId },
        include: {
          project: true,
        },
      });
      expect(result).toBe(false);
    });
  });
});
