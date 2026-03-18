import { describe, it, expect, beforeEach, vi } from 'vitest';

import prisma from '../../../prisma/client.js';
import { ColumnRepository } from '../column.repository.js';

vi.mock('../../../prisma/client.js', () => ({
  default: {
    cmsColumn: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cmsTable: {
      findUnique: vi.fn(),
    },
  },
}));

describe('ColumnRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new ColumnRepository();
    vi.clearAllMocks();
  });

  describe('createColumns', () => {
    it('should create multiple columns at once', async () => {
      // Arrange
      const columnsData = [
        { id: 'col-1', tableId: 'table-456', name: 'Name' },
        { id: 'col-2', tableId: 'table-456', name: 'Email' },
      ];

      const mockCreatedColumns = [
        {
          id: 'col-1',
          tableId: 'table-456',
          name: 'Name',
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
          table: { id: 'table-456', name: 'Test Table' },
        },
        {
          id: 'col-2',
          tableId: 'table-456',
          name: 'Email',
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
          table: { id: 'table-456', name: 'Test Table' },
        },
      ];

      // Mock create for each column
      prisma.cmsColumn.create
        .mockResolvedValueOnce(mockCreatedColumns[0])
        .mockResolvedValueOnce(mockCreatedColumns[1]);

      // Act
      const result = await repository.createColumns(columnsData);

      // Assert
      expect(prisma.cmsColumn.create).toHaveBeenCalledTimes(2);
      expect(prisma.cmsColumn.create).toHaveBeenNthCalledWith(1, {
        data: columnsData[0],
        include: { table: true },
      });
      expect(prisma.cmsColumn.create).toHaveBeenNthCalledWith(2, {
        data: columnsData[1],
        include: { table: true },
      });
      expect(result).toEqual(mockCreatedColumns);
    });

    it('should create single column', async () => {
      // Arrange
      const columnsData = [{ id: 'col-1', tableId: 'table-456', name: 'Name' }];

      const mockCreatedColumn = {
        id: 'col-1',
        tableId: 'table-456',
        name: 'Name',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
        table: { id: 'table-456', name: 'Test Table' },
      };

      prisma.cmsColumn.create.mockResolvedValue(mockCreatedColumn);

      // Act
      const result = await repository.createColumns(columnsData);

      // Assert
      expect(prisma.cmsColumn.create).toHaveBeenCalledTimes(1);
      expect(prisma.cmsColumn.create).toHaveBeenCalledWith({
        data: columnsData[0],
        include: { table: true },
      });
      expect(result).toEqual([mockCreatedColumn]);
    });
  });

  describe('findColumnById', () => {
    it('should return column when found by id', async () => {
      // Arrange
      const columnId = 'col-123';
      const mockColumn = {
        id: 'col-123',
        tableId: 'table-456',
        name: 'Test Column',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
        table: { id: 'table-456', name: 'Test Table' },
        cells: [{ id: 'cell-1', value: 'Cell Value' }],
      };

      prisma.cmsColumn.findUnique.mockResolvedValue(mockColumn);

      // Act
      const result = await repository.findColumnById(columnId);

      // Assert
      expect(prisma.cmsColumn.findUnique).toHaveBeenCalledWith({
        where: { id: columnId },
        include: {
          table: true,
          cells: true,
        },
      });
      expect(result).toEqual(mockColumn);
    });

    it('should return null if column not found', async () => {
      // Arrange
      const columnId = 'non-existent-col';
      prisma.cmsColumn.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findColumnById(columnId);

      // Assert
      expect(prisma.cmsColumn.findUnique).toHaveBeenCalledWith({
        where: { id: columnId },
        include: {
          table: true,
          cells: true,
        },
      });
      expect(result).toBeNull();
    });
  });

  describe('findColumnsByTableId', () => {
    it('should return columns for a given table id with limited cells preview', async () => {
      // Arrange
      const tableId = 'table-456';
      const mockColumns = [
        {
          id: 'col-1',
          tableId: 'table-456',
          name: 'Name',
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
          table: { id: 'table-456', name: 'Test Table' },
          cells: [{ id: 'cell-1', value: 'John' }],
        },
        {
          id: 'col-2',
          tableId: 'table-456',
          name: 'Email',
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
          table: { id: 'table-456', name: 'Test Table' },
          cells: [{ id: 'cell-2', value: 'john@example.com' }],
        },
      ];

      prisma.cmsColumn.findMany.mockResolvedValue(mockColumns);

      // Act
      const result = await repository.findColumnsByTableId(tableId);

      // Assert
      expect(prisma.cmsColumn.findMany).toHaveBeenCalledWith({
        where: { tableId },
        include: {
          table: true,
          cells: {
            take: 5,
          },
        },
      });
      expect(result).toEqual(mockColumns);
    });

    it('should return empty array if no columns found', async () => {
      // Arrange
      const tableId = 'table-empty';
      prisma.cmsColumn.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findColumnsByTableId(tableId);

      // Assert
      expect(prisma.cmsColumn.findMany).toHaveBeenCalledWith({
        where: { tableId },
        include: {
          table: true,
          cells: {
            take: 5,
          },
        },
      });
      expect(result).toEqual([]);
    });
  });

  describe('updateColumn', () => {
    it('should update column and return updated data', async () => {
      // Arrange
      const columnId = 'col-123';
      const updateData = { name: 'Updated Name' };

      const mockUpdatedColumn = {
        id: 'col-123',
        tableId: 'table-456',
        name: 'Updated Name',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-20'),
        table: { id: 'table-456', name: 'Test Table' },
        cells: [],
      };

      prisma.cmsColumn.update.mockResolvedValue(mockUpdatedColumn);

      // Act
      const result = await repository.updateColumn(columnId, updateData);

      // Assert
      expect(prisma.cmsColumn.update).toHaveBeenCalledWith({
        where: { id: columnId },
        data: updateData,
        include: {
          table: true,
          cells: true,
        },
      });
      expect(result).toEqual(mockUpdatedColumn);
    });
  });

  describe('deleteColumn', () => {
    it('should delete column and return deleted column', async () => {
      // Arrange
      const columnId = 'col-123';

      const mockDeletedColumn = {
        id: 'col-123',
        tableId: 'table-456',
        name: 'Deleted Column',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      };

      prisma.cmsColumn.delete.mockResolvedValue(mockDeletedColumn);

      // Act
      const result = await repository.deleteColumn(columnId);

      // Assert
      expect(prisma.cmsColumn.delete).toHaveBeenCalledWith({
        where: { id: columnId },
      });
      expect(result).toEqual(mockDeletedColumn);
    });
  });

  describe('checkColumnOwnership', () => {
    it('should return true if user owns the column', async () => {
      // Arrange
      const columnId = 'col-123';
      const userId = 'user-789';

      const mockColumn = {
        id: 'col-123',
        table: {
          id: 'table-456',
          project: {
            id: 'project-111',
            userId: 'user-789',
          },
        },
      };

      prisma.cmsColumn.findUnique.mockResolvedValue(mockColumn);

      // Act
      const result = await repository.checkColumnOwnership(columnId, userId);

      // Assert
      expect(prisma.cmsColumn.findUnique).toHaveBeenCalledWith({
        where: { id: columnId },
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

    it('should return false if user does not own the column', async () => {
      // Arrange
      const columnId = 'col-123';
      const userId = 'other-user';

      const mockColumn = {
        id: 'col-123',
        table: {
          id: 'table-456',
          project: {
            id: 'project-111',
            userId: 'user-789',
          },
        },
      };

      prisma.cmsColumn.findUnique.mockResolvedValue(mockColumn);

      // Act
      const result = await repository.checkColumnOwnership(columnId, userId);

      // Assert
      expect(prisma.cmsColumn.findUnique).toHaveBeenCalledWith({
        where: { id: columnId },
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

    it('should return false if column not found', async () => {
      // Arrange
      const columnId = 'non-existent-col';
      const userId = 'user-789';

      prisma.cmsColumn.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.checkColumnOwnership(columnId, userId);

      // Assert
      expect(prisma.cmsColumn.findUnique).toHaveBeenCalledWith({
        where: { id: columnId },
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
