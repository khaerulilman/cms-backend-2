import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma client
vi.mock('../../../prisma/client.js', () => ({
  default: {
    cmsTable: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cmsCell: {
      findMany: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
  },
}));

// Import after mocks are set up
import prisma from '../../../prisma/client.js';
import { TableRepository } from '../table.repository.js';

describe('TableRepository', () => {
  let repository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TableRepository();
  });

  describe('createTable', () => {
    it('should create a table with correct data and includes', async () => {
      const tableData = {
        id: 'table-123',
        projectId: 'project-123',
        name: 'Test Table',
        isSubTable: false,
      };

      const mockCreatedTable = {
        ...tableData,
        project: { id: 'project-123', name: 'Project' },
        columns: [],
        rows: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.cmsTable.create.mockResolvedValue(mockCreatedTable);

      const result = await repository.createTable(tableData);

      expect(prisma.cmsTable.create).toHaveBeenCalledWith({
        data: tableData,
        include: {
          project: true,
          columns: true,
          rows: true,
        },
      });
      expect(result).toEqual(mockCreatedTable);
    });
  });

  describe('findTableById', () => {
    it('should find a table by id with full relations', async () => {
      const tableId = 'table-123';
      const mockTable = {
        id: tableId,
        projectId: 'project-123',
        name: 'Test Table',
        isSubTable: false,
        project: { id: 'project-123', name: 'Project', userId: 'user-123' },
        columns: [
          { id: 'col-1', name: 'Column 1' },
          { id: 'col-2', name: 'Column 2' },
        ],
        rows: [
          {
            id: 'row-1',
            cells: [
              { id: 'cell-1', columnId: 'col-1', value: 'Value 1' },
              { id: 'cell-2', columnId: 'col-2', value: 'Value 2' },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.cmsTable.findUnique.mockResolvedValue(mockTable);

      const result = await repository.findTableById(tableId);

      expect(prisma.cmsTable.findUnique).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockTable);
    });

    it('should return null if table not found', async () => {
      prisma.cmsTable.findUnique.mockResolvedValue(null);

      const result = await repository.findTableById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findTablesByProjectId', () => {
    it('should find all tables for a project with preview rows', async () => {
      const projectId = 'project-123';
      const mockTables = [
        {
          id: 'table-1',
          projectId,
          name: 'Table 1',
          columns: [{ id: 'col-1' }],
          rows: [
            { id: 'row-1' },
            { id: 'row-2' },
            { id: 'row-3' },
            { id: 'row-4' },
            { id: 'row-5' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'table-2',
          projectId,
          name: 'Table 2',
          columns: [],
          rows: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.cmsTable.findMany.mockResolvedValue(mockTables);

      const result = await repository.findTablesByProjectId(projectId);

      expect(prisma.cmsTable.findMany).toHaveBeenCalledWith({
        where: { projectId },
        include: {
          columns: true,
          rows: {
            take: 5,
          },
        },
      });
      expect(result).toEqual(mockTables);
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no tables found', async () => {
      prisma.cmsTable.findMany.mockResolvedValue([]);

      const result = await repository.findTablesByProjectId('project-123');

      expect(result).toEqual([]);
    });
  });

  describe('updateTable', () => {
    it('should update table with new data', async () => {
      const tableId = 'table-123';
      const updateData = { name: 'Updated Table Name' };
      const mockUpdatedTable = {
        id: tableId,
        projectId: 'project-123',
        name: 'Updated Table Name',
        isSubTable: false,
        project: { id: 'project-123' },
        columns: [],
        rows: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.cmsTable.update.mockResolvedValue(mockUpdatedTable);

      const result = await repository.updateTable(tableId, updateData);

      expect(prisma.cmsTable.update).toHaveBeenCalledWith({
        where: { id: tableId },
        data: updateData,
        include: {
          project: true,
          columns: true,
          rows: true,
        },
      });
      expect(result).toEqual(mockUpdatedTable);
    });
  });

  describe('deleteTable', () => {
    it('should delete a table by id', async () => {
      const tableId = 'table-123';
      const mockDeletedTable = {
        id: tableId,
        projectId: 'project-123',
        name: 'Deleted Table',
        isSubTable: false,
      };

      prisma.cmsTable.delete.mockResolvedValue(mockDeletedTable);

      const result = await repository.deleteTable(tableId);

      expect(prisma.cmsTable.delete).toHaveBeenCalledWith({
        where: { id: tableId },
      });
      expect(result).toEqual(mockDeletedTable);
    });
  });

  describe('findCellsByTableId', () => {
    it('should find all cells for a table', async () => {
      const tableId = 'table-123';
      const mockCells = [
        {
          id: 'cell-1',
          cloudinaryPublicId: 'public-id-1',
          imageUrl: 'https://example.com/image1.jpg',
        },
        {
          id: 'cell-2',
          cloudinaryPublicId: 'public-id-2',
          imageUrl: 'https://example.com/image2.jpg',
        },
        {
          id: 'cell-3',
          cloudinaryPublicId: null,
          imageUrl: null,
        },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockCells);

      const result = await repository.findCellsByTableId(tableId);

      expect(prisma.cmsCell.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockCells);
      expect(result).toHaveLength(3);
    });

    it('should return empty array if no cells found', async () => {
      prisma.cmsCell.findMany.mockResolvedValue([]);

      const result = await repository.findCellsByTableId('table-123');

      expect(result).toEqual([]);
    });
  });

  describe('checkTableOwnership', () => {
    it('should return true if user owns the table', async () => {
      const tableId = 'table-123';
      const userId = 'user-123';
      const mockTable = {
        id: tableId,
        projectId: 'project-123',
        project: {
          id: 'project-123',
          userId: userId,
        },
      };

      prisma.cmsTable.findUnique.mockResolvedValue(mockTable);

      const result = await repository.checkTableOwnership(tableId, userId);

      expect(prisma.cmsTable.findUnique).toHaveBeenCalledWith({
        where: { id: tableId },
        include: {
          project: true,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not own the table', async () => {
      const tableId = 'table-123';
      const userId = 'user-123';
      const mockTable = {
        id: tableId,
        projectId: 'project-123',
        project: {
          id: 'project-123',
          userId: 'different-user-123',
        },
      };

      prisma.cmsTable.findUnique.mockResolvedValue(mockTable);

      const result = await repository.checkTableOwnership(tableId, userId);

      expect(result).toBe(false);
    });

    it('should return false if table not found', async () => {
      prisma.cmsTable.findUnique.mockResolvedValue(null);

      const result = await repository.checkTableOwnership(
        'non-existent-id',
        'user-123',
      );

      expect(result).toBe(false);
    });
  });

  describe('checkProjectOwnership', () => {
    it('should return true if user owns the project', async () => {
      const projectId = 'project-123';
      const userId = 'user-123';
      const mockProject = {
        id: projectId,
        userId: userId,
        name: 'Test Project',
      };

      prisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await repository.checkProjectOwnership(projectId, userId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not own the project', async () => {
      const projectId = 'project-123';
      const userId = 'user-123';
      const mockProject = {
        id: projectId,
        userId: 'different-user-123',
        name: 'Test Project',
      };

      prisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await repository.checkProjectOwnership(projectId, userId);

      expect(result).toBe(false);
    });

    it('should return false if project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const result = await repository.checkProjectOwnership(
        'non-existent-id',
        'user-123',
      );

      expect(result).toBe(false);
    });
  });
});
