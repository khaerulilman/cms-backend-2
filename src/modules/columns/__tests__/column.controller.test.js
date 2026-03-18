import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ColumnController } from '../column.controller.js';

describe('ColumnController', () => {
  let controller;
  let mockService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      createColumns: vi.fn(),
      getColumnsByTable: vi.fn(),
      getColumnById: vi.fn(),
      updateColumn: vi.fn(),
      deleteColumn: vi.fn(),
    };

    controller = new ColumnController();
    controller.service = mockService;

    mockReq = {
      user: { id: 'user-123' },
      params: {},
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('createColumns', () => {
    it('should return 201 with created columns data', async () => {
      // Arrange
      mockReq.body = {
        tableId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        columns: [{ name: 'Name' }, { name: 'Email' }],
      };

      const mockCreatedColumns = [
        {
          id: 'col-1',
          tableId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          name: 'Name',
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
        },
        {
          id: 'col-2',
          tableId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          name: 'Email',
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
        },
      ];

      mockService.createColumns.mockResolvedValue(mockCreatedColumns);

      // Act
      await controller.createColumns(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.createColumns).toHaveBeenCalledWith(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'user-123',
        [{ name: 'Name' }, { name: 'Email' }],
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Columns created successfully',
        data: mockCreatedColumns,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if tableId is not provided', async () => {
      // Arrange
      mockReq.body = {
        columns: [{ name: 'Name' }],
      };

      // Act
      await controller.createColumns(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.createColumns).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation error',
        }),
      );
    });

    it('should return 400 if tableId is not a valid UUID', async () => {
      // Arrange
      mockReq.body = {
        tableId: 'invalid-uuid',
        columns: [{ name: 'Name' }],
      };

      // Act
      await controller.createColumns(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.createColumns).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation error',
        }),
      );
    });

    it('should return 400 if columns array is not provided', async () => {
      // Arrange
      mockReq.body = {
        tableId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      // Act
      await controller.createColumns(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.createColumns).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if columns array is empty', async () => {
      // Arrange
      mockReq.body = {
        tableId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        columns: [],
      };

      // Act
      await controller.createColumns(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.createColumns).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if column name is missing', async () => {
      // Arrange
      mockReq.body = {
        tableId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        columns: [{ name: '' }],
      };

      // Act
      await controller.createColumns(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.createColumns).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockReq.body = {
        tableId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        columns: [{ name: 'Name' }],
      };

      const error = new Error('Service error');
      mockService.createColumns.mockRejectedValue(error);

      // Act
      await controller.createColumns(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.createColumns).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('getColumnsByTable', () => {
    it('should return 200 with columns data', async () => {
      // Arrange
      mockReq.params = { tableId: 'table-456' };

      const mockColumns = [
        {
          id: 'col-1',
          tableId: 'table-456',
          name: 'Name',
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
        },
        {
          id: 'col-2',
          tableId: 'table-456',
          name: 'Email',
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
        },
      ];

      mockService.getColumnsByTable.mockResolvedValue(mockColumns);

      // Act
      await controller.getColumnsByTable(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.getColumnsByTable).toHaveBeenCalledWith(
        'table-456',
        'user-123',
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Columns retrieved successfully',
        data: mockColumns,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockReq.params = { tableId: 'table-456' };
      const error = new Error('Table not found');
      mockService.getColumnsByTable.mockRejectedValue(error);

      // Act
      await controller.getColumnsByTable(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.getColumnsByTable).toHaveBeenCalledWith(
        'table-456',
        'user-123',
      );
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('getColumnById', () => {
    it('should return 200 with column data', async () => {
      // Arrange
      mockReq.params = { columnId: 'col-123' };

      const mockColumn = {
        id: 'col-123',
        tableId: 'table-456',
        name: 'Name',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      };

      mockService.getColumnById.mockResolvedValue(mockColumn);

      // Act
      await controller.getColumnById(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.getColumnById).toHaveBeenCalledWith(
        'col-123',
        'user-123',
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Column retrieved successfully',
        data: mockColumn,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockReq.params = { columnId: 'col-123' };
      const error = new Error('Column not found');
      mockService.getColumnById.mockRejectedValue(error);

      // Act
      await controller.getColumnById(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.getColumnById).toHaveBeenCalledWith(
        'col-123',
        'user-123',
      );
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('updateColumn', () => {
    it('should return 200 with updated column data', async () => {
      // Arrange
      mockReq.params = { columnId: 'col-123' };
      mockReq.body = { name: 'Updated Name' };

      const mockUpdatedColumn = {
        id: 'col-123',
        tableId: 'table-456',
        name: 'Updated Name',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-20'),
      };

      mockService.updateColumn.mockResolvedValue(mockUpdatedColumn);

      // Act
      await controller.updateColumn(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.updateColumn).toHaveBeenCalledWith(
        'col-123',
        'user-123',
        { name: 'Updated Name' },
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Column updated successfully',
        data: mockUpdatedColumn,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if name is not provided', async () => {
      // Arrange
      mockReq.params = { columnId: 'col-123' };
      mockReq.body = {};

      // Act
      await controller.updateColumn(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.updateColumn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation error',
        }),
      );
    });

    it('should return 400 if name is empty', async () => {
      // Arrange
      mockReq.params = { columnId: 'col-123' };
      mockReq.body = { name: '' };

      // Act
      await controller.updateColumn(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.updateColumn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockReq.params = { columnId: 'col-123' };
      mockReq.body = { name: 'Valid Name' };
      const error = new Error('Column not found');
      mockService.updateColumn.mockRejectedValue(error);

      // Act
      await controller.updateColumn(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.updateColumn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('deleteColumn', () => {
    it('should return 200 with deleted column data', async () => {
      // Arrange
      mockReq.params = { columnId: 'col-123' };

      const mockDeletedColumn = {
        id: 'col-123',
        tableId: 'table-456',
        name: 'Deleted Column',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      };

      mockService.deleteColumn.mockResolvedValue(mockDeletedColumn);

      // Act
      await controller.deleteColumn(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.deleteColumn).toHaveBeenCalledWith(
        'col-123',
        'user-123',
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Column deleted successfully',
        data: mockDeletedColumn,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockReq.params = { columnId: 'col-123' };
      const error = new Error('Column not found');
      mockService.deleteColumn.mockRejectedValue(error);

      // Act
      await controller.deleteColumn(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.deleteColumn).toHaveBeenCalledWith(
        'col-123',
        'user-123',
      );
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
