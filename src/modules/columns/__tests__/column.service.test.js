import { describe, it, expect, beforeEach, vi } from "vitest";

import { NotFoundError, ValidationError } from "../../../utils/errors.js";
import ImageCleanupService from "../../../utils/imageCleanupService.js";
import { ColumnService } from "../column.service.js";

// Mock uuid - return value berbeda dari expected untuk menghindari mock issue
vi.mock("uuid", () => ({
  v4: vi.fn(() => "generated-uuid-col"),
}));

// Mock ImageCleanupService
vi.mock("../../../utils/imageCleanupService.js", () => ({
  default: {
    deleteImagesByColumnId: vi.fn(),
  },
}));

// Mock repository
vi.mock("../column.repository.js", () => ({
  default: class MockColumnRepository {
    checkTableOwnership = vi.fn();
    checkColumnOwnership = vi.fn();
    createColumns = vi.fn();
    findColumnById = vi.fn();
    findColumnsByTableId = vi.fn();
    updateColumn = vi.fn();
    deleteColumn = vi.fn();
  },
}));

describe("ColumnService", () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      checkTableOwnership: vi.fn(),
      checkColumnOwnership: vi.fn(),
      createColumns: vi.fn(),
      findColumnById: vi.fn(),
      findColumnsByTableId: vi.fn(),
      updateColumn: vi.fn(),
      deleteColumn: vi.fn(),
    };

    service = new ColumnService();
    service.repository = mockRepository;
  });

  describe("createColumns", () => {
    it("should successfully create columns for owned table", async () => {
      // Arrange - input data (bukan expected result)
      const tableId = "table-456";
      const userId = "user-789";
      const columns = [{ name: "Name" }, { name: "Email" }];

      // Mock return raw data dari repository
      const mockCreatedColumns = [
        {
          id: "generated-uuid-col",
          tableId: "table-456",
          name: "Name",
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date("2026-01-15"),
        },
        {
          id: "generated-uuid-col",
          tableId: "table-456",
          name: "Email",
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date("2026-01-15"),
        },
      ];

      mockRepository.checkTableOwnership.mockResolvedValue(true);
      mockRepository.createColumns.mockResolvedValue(mockCreatedColumns);

      // Act
      const result = await service.createColumns(tableId, userId, columns);

      // Assert - verifikasi semua mock dipanggil dengan benar
      expect(mockRepository.checkTableOwnership).toHaveBeenCalledWith(
        tableId,
        userId,
      );
      expect(mockRepository.createColumns).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            tableId,
            name: "Name",
          }),
          expect.objectContaining({
            id: expect.any(String),
            tableId,
            name: "Email",
          }),
        ]),
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "generated-uuid-col",
        tableId: "table-456",
        name: "Name",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      });
    });

    it("should throw ValidationError if tableId is empty", async () => {
      // Arrange
      const tableId = "";
      const userId = "user-789";
      const columns = [{ name: "Name" }];

      // Act & Assert
      await expect(
        service.createColumns(tableId, userId, columns),
      ).rejects.toThrow(ValidationError);

      expect(mockRepository.checkTableOwnership).not.toHaveBeenCalled();
      expect(mockRepository.createColumns).not.toHaveBeenCalled();
    });

    it("should throw ValidationError if tableId is only whitespace", async () => {
      // Arrange
      const tableId = "   ";
      const userId = "user-789";
      const columns = [{ name: "Name" }];

      // Act & Assert
      await expect(
        service.createColumns(tableId, userId, columns),
      ).rejects.toThrow(ValidationError);

      expect(mockRepository.checkTableOwnership).not.toHaveBeenCalled();
    });

    it("should throw ValidationError if columns is not an array", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "user-789";
      const columns = "not an array";

      // Act & Assert
      await expect(
        service.createColumns(tableId, userId, columns),
      ).rejects.toThrow(ValidationError);

      expect(mockRepository.checkTableOwnership).not.toHaveBeenCalled();
    });

    it("should throw ValidationError if columns array is empty", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "user-789";
      const columns = [];

      // Act & Assert
      await expect(
        service.createColumns(tableId, userId, columns),
      ).rejects.toThrow(ValidationError);

      expect(mockRepository.checkTableOwnership).not.toHaveBeenCalled();
    });

    it("should throw ValidationError if column name is empty", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "user-789";
      const columns = [{ name: "" }];

      // Act & Assert
      await expect(
        service.createColumns(tableId, userId, columns),
      ).rejects.toThrow(ValidationError);

      expect(mockRepository.checkTableOwnership).not.toHaveBeenCalled();
    });

    it("should throw ValidationError if column name is only whitespace", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "user-789";
      const columns = [{ name: "   " }];

      // Act & Assert
      await expect(
        service.createColumns(tableId, userId, columns),
      ).rejects.toThrow(ValidationError);

      expect(mockRepository.checkTableOwnership).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if user does not own table", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "other-user";
      const columns = [{ name: "Name" }];

      mockRepository.checkTableOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.createColumns(tableId, userId, columns),
      ).rejects.toThrow(NotFoundError);

      expect(mockRepository.checkTableOwnership).toHaveBeenCalledWith(
        tableId,
        userId,
      );
      expect(mockRepository.createColumns).not.toHaveBeenCalled();
    });

    it("should trim column names before creating", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "user-789";
      const columns = [{ name: "  Name with spaces  " }];

      const mockCreatedColumn = {
        id: "generated-uuid-col",
        tableId: "table-456",
        name: "Name with spaces",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      };

      mockRepository.checkTableOwnership.mockResolvedValue(true);
      mockRepository.createColumns.mockResolvedValue([mockCreatedColumn]);

      // Act
      await service.createColumns(tableId, userId, columns);

      // Assert - verify trimmed name is used
      expect(mockRepository.createColumns).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Name with spaces",
          }),
        ]),
      );
    });
  });

  describe("getColumnsByTable", () => {
    it("should return formatted columns for owned table", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "user-789";

      const mockColumns = [
        {
          id: "col-1",
          tableId: "table-456",
          name: "Name",
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date("2026-01-15"),
        },
        {
          id: "col-2",
          tableId: "table-456",
          name: "Email",
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date("2026-01-15"),
        },
      ];

      mockRepository.checkTableOwnership.mockResolvedValue(true);
      mockRepository.findColumnsByTableId.mockResolvedValue(mockColumns);

      // Act
      const result = await service.getColumnsByTable(tableId, userId);

      // Assert
      expect(mockRepository.checkTableOwnership).toHaveBeenCalledWith(
        tableId,
        userId,
      );
      expect(mockRepository.findColumnsByTableId).toHaveBeenCalledWith(tableId);
      expect(result).toHaveLength(2);
    });

    it("should throw NotFoundError if user does not own table", async () => {
      // Arrange
      const tableId = "table-456";
      const userId = "other-user";

      mockRepository.checkTableOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(service.getColumnsByTable(tableId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkTableOwnership).toHaveBeenCalledWith(
        tableId,
        userId,
      );
      expect(mockRepository.findColumnsByTableId).not.toHaveBeenCalled();
    });
  });

  describe("getColumnById", () => {
    it("should return formatted column for owned column", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "user-789";

      const mockColumn = {
        id: "col-123",
        tableId: "table-456",
        name: "Name",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      };

      mockRepository.checkColumnOwnership.mockResolvedValue(true);
      mockRepository.findColumnById.mockResolvedValue(mockColumn);

      // Act
      const result = await service.getColumnById(columnId, userId);

      // Assert
      expect(mockRepository.checkColumnOwnership).toHaveBeenCalledWith(
        columnId,
        userId,
      );
      expect(mockRepository.findColumnById).toHaveBeenCalledWith(columnId);
      expect(result).toEqual({
        id: "col-123",
        tableId: "table-456",
        name: "Name",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      });
    });

    it("should throw NotFoundError if user does not own column", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "other-user";

      mockRepository.checkColumnOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(service.getColumnById(columnId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkColumnOwnership).toHaveBeenCalledWith(
        columnId,
        userId,
      );
      expect(mockRepository.findColumnById).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if column not found after ownership check", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "user-789";

      mockRepository.checkColumnOwnership.mockResolvedValue(true);
      mockRepository.findColumnById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getColumnById(columnId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkColumnOwnership).toHaveBeenCalledWith(
        columnId,
        userId,
      );
      expect(mockRepository.findColumnById).toHaveBeenCalledWith(columnId);
    });
  });

  describe("updateColumn", () => {
    it("should update column successfully", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "user-789";
      const data = { name: "Updated Name" };

      const mockUpdatedColumn = {
        id: "col-123",
        tableId: "table-456",
        name: "Updated Name",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-20"),
      };

      mockRepository.checkColumnOwnership.mockResolvedValue(true);
      mockRepository.updateColumn.mockResolvedValue(mockUpdatedColumn);

      // Act
      const result = await service.updateColumn(columnId, userId, data);

      // Assert
      expect(mockRepository.checkColumnOwnership).toHaveBeenCalledWith(
        columnId,
        userId,
      );
      expect(mockRepository.updateColumn).toHaveBeenCalledWith(columnId, {
        name: "Updated Name",
      });
      expect(result).toEqual({
        id: "col-123",
        tableId: "table-456",
        name: "Updated Name",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-20"),
      });
    });

    it("should throw ValidationError if name is empty", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "user-789";
      const data = { name: "" };

      // Act & Assert
      await expect(
        service.updateColumn(columnId, userId, data),
      ).rejects.toThrow(ValidationError);

      expect(mockRepository.checkColumnOwnership).not.toHaveBeenCalled();
      expect(mockRepository.updateColumn).not.toHaveBeenCalled();
    });

    it("should throw ValidationError if name is only whitespace", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "user-789";
      const data = { name: "   " };

      // Act & Assert
      await expect(
        service.updateColumn(columnId, userId, data),
      ).rejects.toThrow(ValidationError);

      expect(mockRepository.checkColumnOwnership).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if user does not own column", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "other-user";
      const data = { name: "New Name" };

      mockRepository.checkColumnOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(
        service.updateColumn(columnId, userId, data),
      ).rejects.toThrow(NotFoundError);

      expect(mockRepository.checkColumnOwnership).toHaveBeenCalledWith(
        columnId,
        userId,
      );
      expect(mockRepository.updateColumn).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if update returns null", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "user-789";
      const data = { name: "New Name" };

      mockRepository.checkColumnOwnership.mockResolvedValue(true);
      mockRepository.updateColumn.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateColumn(columnId, userId, data),
      ).rejects.toThrow(NotFoundError);

      expect(mockRepository.checkColumnOwnership).toHaveBeenCalledWith(
        columnId,
        userId,
      );
      expect(mockRepository.updateColumn).toHaveBeenCalledWith(columnId, {
        name: "New Name",
      });
    });

    it("should trim name before updating", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "user-789";
      const data = { name: "  Trimmed Name  " };

      const mockUpdatedColumn = {
        id: "col-123",
        tableId: "table-456",
        name: "Trimmed Name",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-20"),
      };

      mockRepository.checkColumnOwnership.mockResolvedValue(true);
      mockRepository.updateColumn.mockResolvedValue(mockUpdatedColumn);

      // Act
      await service.updateColumn(columnId, userId, data);

      // Assert
      expect(mockRepository.updateColumn).toHaveBeenCalledWith(columnId, {
        name: "Trimmed Name",
      });
    });
  });

  describe("deleteColumn", () => {
    it("should delete column and cleanup images", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "user-789";

      const mockDeletedColumn = {
        id: "col-123",
        tableId: "table-456",
        name: "Deleted Column",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      };

      mockRepository.checkColumnOwnership.mockResolvedValue(true);
      ImageCleanupService.deleteImagesByColumnId.mockResolvedValue();
      mockRepository.deleteColumn.mockResolvedValue(mockDeletedColumn);

      // Act
      const result = await service.deleteColumn(columnId, userId);

      // Assert - verifikasi semua mock dipanggil
      expect(mockRepository.checkColumnOwnership).toHaveBeenCalledWith(
        columnId,
        userId,
      );
      expect(ImageCleanupService.deleteImagesByColumnId).toHaveBeenCalledWith(
        columnId,
      );
      expect(mockRepository.deleteColumn).toHaveBeenCalledWith(columnId);

      expect(result).toEqual({
        id: "col-123",
        tableId: "table-456",
        name: "Deleted Column",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      });
    });

    it("should throw NotFoundError if user does not own column", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "other-user";

      mockRepository.checkColumnOwnership.mockResolvedValue(false);

      // Act & Assert
      await expect(service.deleteColumn(columnId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkColumnOwnership).toHaveBeenCalledWith(
        columnId,
        userId,
      );
      expect(ImageCleanupService.deleteImagesByColumnId).not.toHaveBeenCalled();
      expect(mockRepository.deleteColumn).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if delete returns null", async () => {
      // Arrange
      const columnId = "col-123";
      const userId = "user-789";

      mockRepository.checkColumnOwnership.mockResolvedValue(true);
      ImageCleanupService.deleteImagesByColumnId.mockResolvedValue();
      mockRepository.deleteColumn.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteColumn(columnId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkColumnOwnership).toHaveBeenCalledWith(
        columnId,
        userId,
      );
      expect(ImageCleanupService.deleteImagesByColumnId).toHaveBeenCalledWith(
        columnId,
      );
      expect(mockRepository.deleteColumn).toHaveBeenCalledWith(columnId);
    });
  });

  describe("_formatColumn", () => {
    it("should format column correctly", () => {
      // Arrange
      const rawColumn = {
        id: "col-123",
        tableId: "table-456",
        name: "Test Column",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
        // Extra fields from includes that should be stripped
        table: { id: "table-456", name: "Table" },
        cells: [{ id: "cell-1" }],
      };

      // Act
      const result = service._formatColumn(rawColumn);

      // Assert
      expect(result).toEqual({
        id: "col-123",
        tableId: "table-456",
        name: "Test Column",
        createdAt: new Date("2026-01-15"),
        updatedAt: new Date("2026-01-15"),
      });
      expect(result.table).toBeUndefined();
      expect(result.cells).toBeUndefined();
    });
  });
});
