import { describe, it, expect, beforeEach, vi } from "vitest";

import CloudinaryService from "../../../utils/cloudinary.js";
import { NotFoundError } from "../../../utils/errors.js";
import { CellService } from "../cell.service.js";

// Mock logger to prevent noise in test output
vi.mock("../../../utils/logger.js", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock dependencies
vi.mock("../../../utils/cloudinary.js", () => ({
  default: {
    deleteImage: vi.fn(),
    uploadImage: vi.fn(),
  },
}));

vi.mock("../../../utils/imageCleanupService.js", () => ({
  default: class MockImageCleanupService {},
}));

vi.mock("../cell.repository.js", () => ({
  default: class MockCellRepository {
    checkRowOwnership = vi.fn();
    findCellsByRowId = vi.fn();
    findCellByRowAndColumn = vi.fn();
    upsertCell = vi.fn();
  },
}));

describe("CellService", () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      checkRowOwnership: vi.fn(),
      findCellsByRowId: vi.fn(),
      findCellByRowAndColumn: vi.fn(),
      upsertCell: vi.fn(),
    };

    service = new CellService();
    service.repository = mockRepository;
  });

  describe("getCellsByRow", () => {
    it("should return formatted cells if user owns the row", async () => {
      const rowId = "row-123";
      const userId = "user-123";

      const mockCells = [
        {
          id: "cell-1",
          rowId,
          columnId: "col-1",
          value: "Test Value",
          imageUrl: null,
          cloudinaryPublicId: null,
          createdAt: new Date("2025-01-15"),
          updatedAt: new Date("2025-01-15"),
          column: { name: "Column 1" },
        },
      ];

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      mockRepository.findCellsByRowId.mockResolvedValue(mockCells);

      const result = await service.getCellsByRow(rowId, userId);

      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(mockRepository.findCellsByRowId).toHaveBeenCalledWith(rowId);
      expect(result).toEqual([
        {
          id: "cell-1",
          rowId,
          columnId: "col-1",
          columnName: "Column 1",
          value: "Test Value",
          imageUrl: null,
          cloudinaryPublicId: null,
          createdAt: new Date("2025-01-15"),
          updatedAt: new Date("2025-01-15"),
        },
      ]);
    });

    it("should throw NotFoundError if user does not own the row", async () => {
      const rowId = "row-123";
      const userId = "user-123";

      mockRepository.checkRowOwnership.mockResolvedValue(false);

      await expect(service.getCellsByRow(rowId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(mockRepository.findCellsByRowId).not.toHaveBeenCalled();
    });
  });

  describe("upsertCell", () => {
    const rowId = "row-123";
    const columnId = "col-1";
    const userId = "user-123";

    it("should upsert cell with image upload", async () => {
      const imageFile = { path: "/tmp/upload.jpg" };
      const existingCell = null;

      const mockUploadResult = {
        imageUrl: "https://cloudinary.com/image.jpg",
        publicId: "public_id_123",
      };

      const mockUpsertedCell = {
        id: "cell-1",
        rowId,
        columnId,
        value: null,
        imageUrl: "https://cloudinary.com/image.jpg",
        cloudinaryPublicId: "public_id_123",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        column: { name: "Column 1" },
      };

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      mockRepository.findCellByRowAndColumn.mockResolvedValue(existingCell);
      CloudinaryService.uploadImage.mockResolvedValue(mockUploadResult);
      mockRepository.upsertCell.mockResolvedValue(mockUpsertedCell);

      const result = await service.upsertCell(
        rowId,
        columnId,
        userId,
        null,
        imageFile,
      );

      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(mockRepository.findCellByRowAndColumn).toHaveBeenCalledWith(
        rowId,
        columnId,
      );
      expect(CloudinaryService.uploadImage).toHaveBeenCalledWith(
        "/tmp/upload.jpg",
      );
      expect(mockRepository.upsertCell).toHaveBeenCalledWith(
        rowId,
        columnId,
        null,
        "https://cloudinary.com/image.jpg",
        "public_id_123",
      );
      expect(result).toEqual({
        id: "cell-1",
        rowId,
        columnId,
        columnName: "Column 1",
        value: null,
        imageUrl: "https://cloudinary.com/image.jpg",
        cloudinaryPublicId: "public_id_123",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      });
    });

    it("should upsert cell with text value and delete existing image", async () => {
      const value = "New Text Value";
      const imageFile = null;
      const existingCell = {
        cloudinaryPublicId: "old_public_id",
      };

      const mockUpsertedCell = {
        id: "cell-1",
        rowId,
        columnId,
        value: "New Text Value",
        imageUrl: null,
        cloudinaryPublicId: null,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        column: { name: "Column 1" },
      };

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      mockRepository.findCellByRowAndColumn.mockResolvedValue(existingCell);
      CloudinaryService.deleteImage.mockResolvedValue();
      mockRepository.upsertCell.mockResolvedValue(mockUpsertedCell);

      const result = await service.upsertCell(
        rowId,
        columnId,
        userId,
        value,
        imageFile,
      );

      expect(CloudinaryService.deleteImage).toHaveBeenCalledWith(
        "old_public_id",
      );
      expect(mockRepository.upsertCell).toHaveBeenCalledWith(
        rowId,
        columnId,
        "New Text Value",
        null,
        null,
      );
      expect(result).toEqual({
        id: "cell-1",
        rowId,
        columnId,
        columnName: "Column 1",
        value: "New Text Value",
        imageUrl: null,
        cloudinaryPublicId: null,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      });
    });

    it("should upsert cell clearing the cell", async () => {
      const value = "";
      const imageFile = null;
      const existingCell = {
        cloudinaryPublicId: "old_public_id",
      };

      const mockUpsertedCell = {
        id: "cell-1",
        rowId,
        columnId,
        value: null,
        imageUrl: null,
        cloudinaryPublicId: null,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        column: { name: "Column 1" },
      };

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      mockRepository.findCellByRowAndColumn.mockResolvedValue(existingCell);
      CloudinaryService.deleteImage.mockResolvedValue();
      mockRepository.upsertCell.mockResolvedValue(mockUpsertedCell);

      const result = await service.upsertCell(
        rowId,
        columnId,
        userId,
        value,
        imageFile,
      );

      expect(CloudinaryService.deleteImage).toHaveBeenCalledWith(
        "old_public_id",
      );
      expect(mockRepository.upsertCell).toHaveBeenCalledWith(
        rowId,
        columnId,
        null,
        null,
        null,
      );
      expect(result).toEqual({
        id: "cell-1",
        rowId,
        columnId,
        columnName: "Column 1",
        value: null,
        imageUrl: null,
        cloudinaryPublicId: null,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      });
    });

    it("should throw NotFoundError if user does not own the row", async () => {
      mockRepository.checkRowOwnership.mockResolvedValue(false);

      await expect(
        service.upsertCell(rowId, columnId, userId, "value", null),
      ).rejects.toThrow(NotFoundError);

      expect(mockRepository.checkRowOwnership).toHaveBeenCalledWith(
        rowId,
        userId,
      );
      expect(mockRepository.findCellByRowAndColumn).not.toHaveBeenCalled();
    });

    it("should throw error on image upload failure", async () => {
      const imageFile = { path: "/tmp/upload.jpg" };

      mockRepository.checkRowOwnership.mockResolvedValue(true);
      mockRepository.findCellByRowAndColumn.mockResolvedValue(null);
      CloudinaryService.uploadImage.mockRejectedValue(
        new Error("Upload failed"),
      );

      await expect(
        service.upsertCell(rowId, columnId, userId, null, imageFile),
      ).rejects.toThrow("Failed to upload image: Upload failed");
    });

    it("should throw NotFoundError if upsert returns null", async () => {
      mockRepository.checkRowOwnership.mockResolvedValue(true);
      mockRepository.findCellByRowAndColumn.mockResolvedValue(null);
      mockRepository.upsertCell.mockResolvedValue(null);

      await expect(
        service.upsertCell(rowId, columnId, userId, "value", null),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
