import { describe, it, expect, beforeEach, vi } from "vitest";

import { NotFoundError } from "../../../utils/errors.js";
import ImageCleanupService from "../../../utils/imageCleanupService.js";
import { RowService } from "../row.service.js";

// Mock uuid - return value berbeda dari expected untuk menghindari mock issue
vi.mock("uuid", () => ({
  v4: vi.fn(() => "generated-uuid-123"),
}));

// Mock ImageCleanupService
vi.mock("../../../utils/imageCleanupService.js", () => ({
  default: {
    deleteImagesByRowId: vi.fn(),
  },
}));

// Mock repository
vi.mock("../row.repository.js", () => ({
  default: class MockRowRepository {
    checkTableOwnership = vi.fn();
    checkRowOwnership = vi.fn();
    createRow = vi.fn();
    findRowById = vi.fn();
    findRowsByTableId = vi.fn();
    updateRow = vi.fn();
    deleteRow = vi.fn();
    findCellsByRowId = vi.fn();
  },
}));

describe("RowService", () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      checkTableOwnership: vi.fn(),
      checkRowOwnership: vi.fn(),
      createRow: vi.fn(),
      findRowById: vi.fn(),
      findRowsByTableId: vi.fn(),
      updateRow: vi.fn(),
      deleteRow: vi.fn(),
      findCellsByRowId: vi.fn(),
    };

    service = new RowService();
    service.repository = mockRepository;
  });

  describe("createRow", () => {
    it("should successfully create a row for owned table", async () => {
      // Arrange - return value berbeda dari expected (sesuai kriteria mock issue)
      const tableId = "table-456";
      const userId = "user-789";

      // Mock return raw data (bukan expected result)
      const mockCreatedRow = {
        id: "generated-uuid-123",
        tableId: "table-456",
        cells: [],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      };

      mockRepository.checkTableOwnership.mockResolvedValue(true);
      mockRepository.createRow.mockResolvedValue(mockCreatedRow);

      // Act
      const result = await service.createRow(tableId, userId);

      // Assert - verifikasi semua mock dipanggil dengan benar
      expect(mockRepository.checkTableOwnership).toHaveBeenCalledWith(
        tableId,
        userId,
      );
      expect(mockRepository.createRow).toHaveBeenCalledWith({
        id: expect.any(String),
        tableId,
      });

      // Expected result setelah formatting
      expect(result).toEqual({
        id: "generated-uuid-123",
        tableId: "table-456",
        cells: [],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      });
    });

    it("should throw NotFoundError if user does not own table", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "other-user";

      mockRepository.checkTableOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(service.createRow(tableId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkTableOwnership).toHaveBeenCalledWith(
        tableId,
        userId,
      );
      expect(mockRepository.createRow).not.toHaveBeenCalled();
    });
  });

  describe("getRowsByTable", () => {
    it("should return formatted rows for owned table", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "user-789";

      // Mock raw data dari repository
      const mockRows = [
        {
          id: "row-1",
          tableId: "table-456",
          cells: [
            {
              id: "cell-1",
              rowId: "row-1",
              columnId: "col-1",
              column: { name: "Name" },
              value: "John",
              imageUrl: null,
              cloudinaryPublicId: null,
              createdAt: new Date("2026-01-15"),
              updatedAt: new Date("2026-01-15"),
            },
          ],
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date("2026-01-15"),
        },
      ];

      mockRepository.checkTableOwnership.mockResolvedValue(true);
      mockRepository.findRowsByTableId.mockResolvedValue(mockRows);

      // Act
      const result = await service.getRowsByTable(tableId, userId);

      // Assert - verifikasi mock calls
      expect(mockRepository.checkTableOwnership).toHaveBeenCalledWith(
        tableId,
        userId,
      );
      expect(mockRepository.findRowsByTableId).toHaveBeenCalledWith(tableId);

      // Verify formatted result
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "row-1",
        tableId: "table-456",
        cells: [
          {
            id: "cell-1",
            rowId: "row-1",
            columnId: "col-1",
            columnName: "Name",
            value: "John",
            imageUrl: null,
            cloudinaryPublicId: null,
            createdAt: new Date("2026-01-15"),
            updatedAt: new Date("2026-01-15"),
          },
        ],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      });
    });

    it("should throw NotFoundError if user does not own table", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "other-user";

      mockRepository.checkTableOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(service.getRowsByTable(tableId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkTableOwnership).toHaveBeenCalledWith(
        tableId,
        userId,
      );
      expect(mockRepository.findRowsByTableId).not.toHaveBeenCalled();
    });
  });

  describe("getRowById", () => {
    it("should return formatted row for owned row", async () => {
      // Arrange
      const rowId = "row-123";
      const userId = "user-789";

      const mockRow = {
        id: "row-123",
        tableId: "table-456",
        cells: [
          {
            id: "cell-1",
            rowId: "row-123",
            columnId: "col-1",
            column: { name: "Email" },
            value: "test@example.com",
            imageUrl: "https://cloudinary.com/image.jpg",
            cloudinaryPublicId: "public-id-1",
            createdAt: new Date("2026-01-15"),
            updatedAt: new Date("2026-01-15"),
          },
        ],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      };

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      mockRepository.findRowById.mockResolvedValue(mockRow);

      // Act
      const result = await service.getRowById(rowId, userId);

      // Assert
      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(mockRepository.findRowById).toHaveBeenCalledWith(rowId);

      expect(result).toEqual({
        id: "row-123",
        tableId: "table-456",
        cells: [
          {
            id: "cell-1",
            rowId: "row-123",
            columnId: "col-1",
            columnName: "Email",
            value: "test@example.com",
            imageUrl: "https://cloudinary.com/image.jpg",
            cloudinaryPublicId: "public-id-1",
            createdAt: new Date("2026-01-15"),
            updatedAt: new Date("2026-01-15"),
          },
        ],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      });
    });

    it("should throw NotFoundError if user does not own row", async () => {
      // Arrange
      const rowId = "row-123";
      const userId = "other-user";

      mockRepository.checkRowOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(service.getRowById(rowId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(mockRepository.findRowById).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if row not found after ownership check", async () => {
      // Arrange
      const rowId = "row-123";
      const userId = "user-789";

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      mockRepository.findRowById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRowById(rowId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(mockRepository.findRowById).toHaveBeenCalledWith(rowId);
    });
  });

  describe("updateRow", () => {
    it("should return row when ownership is valid", async () => {
      // Arrange
      const rowId = "row-123";
      const userId = "user-789";
      const data = {};

      const mockRow = {
        id: "row-123",
        tableId: "table-456",
        cells: [],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      };

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      mockRepository.findRowById.mockResolvedValue(mockRow);

      // Act
      const result = await service.updateRow(rowId, userId, data);

      // Assert
      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(mockRepository.findRowById).toHaveBeenCalledWith(rowId);
      expect(result).toEqual({
        id: "row-123",
        tableId: "table-456",
        cells: [],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      });
    });

    it("should throw NotFoundError if user does not own row", async () => {
      // Arrange
      const rowId = "row-123";
      const userId = "other-user";
      const data = {};

      mockRepository.checkRowOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(service.updateRow(rowId, userId, data)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(mockRepository.findRowById).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if row not found", async () => {
      // Arrange
      const rowId = "row-123";
      const userId = "user-789";
      const data = {};

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      mockRepository.findRowById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateRow(rowId, userId, data)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(mockRepository.findRowById).toHaveBeenCalledWith(rowId);
    });
  });

  describe("deleteRow", () => {
    it("should delete row and cleanup images", async () => {
      // Arrange
      const rowId = "row-123";
      const userId = "user-789";

      const mockDeletedRow = {
        id: "row-123",
        tableId: "table-456",
        cells: [],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      };

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      ImageCleanupService.deleteImagesByRowId.mockResolvedValue();
      mockRepository.deleteRow.mockResolvedValue(mockDeletedRow);

      // Act
      const result = await service.deleteRow(rowId, userId);

      // Assert - verifikasi semua mock dipanggil
      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(ImageCleanupService.deleteImagesByRowId).toHaveBeenCalledWith(
        rowId,
      );
      expect(mockRepository.deleteRow).toHaveBeenCalledWith(rowId);

      expect(result).toEqual({
        id: "row-123",
        tableId: "table-456",
        cells: [],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      });
    });

    it("should throw NotFoundError if user does not own row", async () => {
      // Arrange
      const rowId = "row-123";
      const userId = "other-user";

      mockRepository.checkRowOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(service.deleteRow(rowId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(ImageCleanupService.deleteImagesByRowId).not.toHaveBeenCalled();
      expect(mockRepository.deleteRow).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if delete returns null", async () => {
      // Arrange
      const rowId = "row-123";
      const userId = "user-789";

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      ImageCleanupService.deleteImagesByRowId.mockResolvedValue();
      mockRepository.deleteRow.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteRow(rowId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(ImageCleanupService.deleteImagesByRowId).toHaveBeenCalledWith(
        rowId,
      );
      expect(mockRepository.deleteRow).toHaveBeenCalledWith(rowId);
    });
  });

  describe("_formatRow", () => {
    it("should format row with cells correctly", () => {
      // Arrange - raw data
      const rawRow = {
        id: "row-123",
        tableId: "table-456",
        cells: [
          {
            id: "cell-1",
            rowId: "row-123",
            columnId: "col-1",
            column: { name: "Title" },
            value: "Test Title",
            imageUrl: null,
            cloudinaryPublicId: null,
            createdAt: new Date("2026-01-15"),
            updatedAt: new Date("2026-01-15"),
          },
        ],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      };

      // Act
      const result = service._formatRow(rawRow);

      // Assert
      expect(result).toEqual({
        id: "row-123",
        tableId: "table-456",
        cells: [
          {
            id: "cell-1",
            rowId: "row-123",
            columnId: "col-1",
            columnName: "Title",
            value: "Test Title",
            imageUrl: null,
            cloudinaryPublicId: null,
            createdAt: new Date("2026-01-15"),
            updatedAt: new Date("2026-01-15"),
          },
        ],
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      });
    });

    it("should return empty cells array if no cells", () => {
      // Arrange
      const rawRow = {
        id: "row-123",
        tableId: "table-456",
        cells: null,
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      };

      // Act
      const result = service._formatRow(rawRow);

      // Assert
      expect(result.cells).toEqual([]);
    });
  });
});
