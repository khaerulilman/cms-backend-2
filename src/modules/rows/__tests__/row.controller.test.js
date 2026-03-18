import { describe, it, expect, beforeEach, vi } from 'vitest';

import { RowController } from '../row.controller.js';

describe('RowController', () => {
  let controller;
  let mockService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      createRow: vi.fn(),
      getRowsByTable: vi.fn(),
      getRowById: vi.fn(),
      updateRow: vi.fn(),
      deleteRow: vi.fn(),
    };

    controller = new RowController();
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

  describe('createRow', () => {
    it('should return 201 with created row data', async () => {
      // Arrange
      mockReq.body = { tableId: 'table-456' };

      // Mock service return (different from expected response structure)
      const mockCreatedRow = {
        id: 'row-123',
        tableId: 'table-456',
        cells: [],
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      };

      mockService.createRow.mockResolvedValue(mockCreatedRow);

      // Act
      await controller.createRow(mockReq, mockRes, mockNext);

      // Assert - verify mock was called correctly
      expect(mockService.createRow).toHaveBeenCalledWith(
        'table-456',
        'user-123',
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Row created successfully',
        data: mockCreatedRow,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if tableId is not provided', async () => {
      // Arrange
      mockReq.body = {};

      // Act
      await controller.createRow(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.createRow).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Table ID is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockReq.body = { tableId: 'table-456' };
      const error = new Error('Service error');
      mockService.createRow.mockRejectedValue(error);

      // Act
      await controller.createRow(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.createRow).toHaveBeenCalledWith(
        'table-456',
        'user-123',
      );
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('getRowsByTable', () => {
    it('should return 200 with rows data', async () => {
      // Arrange
      mockReq.params = { tableId: 'table-456' };

      const mockRows = [
        {
          id: 'row-1',
          tableId: 'table-456',
          cells: [],
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
        },
        {
          id: 'row-2',
          tableId: 'table-456',
          cells: [],
          createdAt: new Date('2026-01-16'),
          updatedAt: new Date('2026-01-16'),
        },
      ];

      mockService.getRowsByTable.mockResolvedValue(mockRows);

      // Act
      await controller.getRowsByTable(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.getRowsByTable).toHaveBeenCalledWith(
        'table-456',
        'user-123',
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Rows retrieved successfully',
        data: mockRows,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockReq.params = { tableId: 'table-456' };
      const error = new Error('Table not found');
      mockService.getRowsByTable.mockRejectedValue(error);

      // Act
      await controller.getRowsByTable(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.getRowsByTable).toHaveBeenCalledWith(
        'table-456',
        'user-123',
      );
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('getRowById', () => {
    it('should return 200 with row data', async () => {
      // Arrange
      mockReq.params = { rowId: 'row-123' };

      const mockRow = {
        id: 'row-123',
        tableId: 'table-456',
        cells: [
          {
            id: 'cell-1',
            rowId: 'row-123',
            columnId: 'col-1',
            columnName: 'Name',
            value: 'John Doe',
            imageUrl: null,
            cloudinaryPublicId: null,
            createdAt: new Date('2026-01-15'),
            updatedAt: new Date('2026-01-15'),
          },
        ],
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      };

      mockService.getRowById.mockResolvedValue(mockRow);

      // Act
      await controller.getRowById(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.getRowById).toHaveBeenCalledWith(
        'row-123',
        'user-123',
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Row retrieved successfully',
        data: mockRow,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockReq.params = { rowId: 'row-123' };
      const error = new Error('Row not found');
      mockService.getRowById.mockRejectedValue(error);

      // Act
      await controller.getRowById(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.getRowById).toHaveBeenCalledWith(
        'row-123',
        'user-123',
      );
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('updateRow', () => {
    it('should return 200 with updated row data', async () => {
      // Arrange
      mockReq.params = { rowId: 'row-123' };
      mockReq.body = { someData: 'value' };

      const mockUpdatedRow = {
        id: 'row-123',
        tableId: 'table-456',
        cells: [],
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-20'),
      };

      mockService.updateRow.mockResolvedValue(mockUpdatedRow);

      // Act
      await controller.updateRow(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.updateRow).toHaveBeenCalledWith(
        'row-123',
        'user-123',
        { someData: 'value' },
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Row updated successfully',
        data: mockUpdatedRow,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockReq.params = { rowId: 'row-123' };
      mockReq.body = {};
      const error = new Error('Row not found');
      mockService.updateRow.mockRejectedValue(error);

      // Act
      await controller.updateRow(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.updateRow).toHaveBeenCalledWith(
        'row-123',
        'user-123',
        {},
      );
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('deleteRow', () => {
    it('should return 200 with deleted row data', async () => {
      // Arrange
      mockReq.params = { rowId: 'row-123' };

      const mockDeletedRow = {
        id: 'row-123',
        tableId: 'table-456',
        cells: [],
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      };

      mockService.deleteRow.mockResolvedValue(mockDeletedRow);

      // Act
      await controller.deleteRow(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.deleteRow).toHaveBeenCalledWith('row-123', 'user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Row deleted successfully',
        data: mockDeletedRow,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      // Arrange
      mockReq.params = { rowId: 'row-123' };
      const error = new Error('Row not found');
      mockService.deleteRow.mockRejectedValue(error);

      // Act
      await controller.deleteRow(mockReq, mockRes, mockNext);

      // Assert
      expect(mockService.deleteRow).toHaveBeenCalledWith('row-123', 'user-123');
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
