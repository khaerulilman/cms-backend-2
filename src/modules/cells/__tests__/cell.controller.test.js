import { describe, it, expect, beforeEach, vi } from "vitest";

import FileUtils from "../../../utils/file.js";
import { CellController } from "../cell.controller.js";

// Mock dependencies
vi.mock("../cell.service.js", () => ({
  default: class MockCellService {
    getCellsByRow = vi.fn();
    upsertCell = vi.fn();
  },
}));

vi.mock("../../../utils/file.js", () => ({
  default: {
    deleteFile: vi.fn(),
  },
}));

vi.mock("../../../constants/http.js", () => ({
  HTTP_STATUS: {
    OK: 200,
  },
  SUCCESS_MESSAGES: {
    CELLS_RETRIEVED: "Cells retrieved successfully",
    CELL_UPSERTED: "Cell upserted successfully",
  },
  ERROR_MESSAGES: {},
}));

describe("CellController", () => {
  let controller;
  let mockService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      getCellsByRow: vi.fn(),
      upsertCell: vi.fn(),
    };

    controller = new CellController();
    controller.service = mockService;

    mockReq = {
      user: { id: "user-123" },
      params: {},
      body: {},
      file: null,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe("getCellsByRow", () => {
    it("should return 200 with cells data", async () => {
      mockReq.params = { rowId: "row-123" };

      const mockCells = [
        {
          id: "cell-1",
          rowId: "row-123",
          columnId: "col-1",
          columnName: "Column 1",
          value: "Test Value",
          imageUrl: null,
          cloudinaryPublicId: null,
          createdAt: new Date("2025-01-15"),
          updatedAt: new Date("2025-01-15"),
        },
      ];

      mockService.getCellsByRow.mockResolvedValue(mockCells);

      await controller.getCellsByRow(mockReq, mockRes, mockNext);

      expect(mockService.getCellsByRow).toHaveBeenCalledWith(
        "row-123",
        "user-123",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Cells retrieved successfully",
        data: mockCells,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      mockReq.params = { rowId: "row-123" };

      const error = new Error("Service error");
      mockService.getCellsByRow.mockRejectedValue(error);

      await controller.getCellsByRow(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("upsertCell", () => {
    it("should return 200 with upserted cell data and clean up file", async () => {
      mockReq.params = { rowId: "row-123" };
      mockReq.body = { columnId: "col-1", value: "New Value" };
      mockReq.file = { path: "/tmp/upload.jpg" };

      const mockCell = {
        id: "cell-1",
        rowId: "row-123",
        columnId: "col-1",
        columnName: "Column 1",
        value: "New Value",
        imageUrl: null,
        cloudinaryPublicId: null,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      };

      mockService.upsertCell.mockResolvedValue(mockCell);

      await controller.upsertCell(mockReq, mockRes, mockNext);

      expect(mockService.upsertCell).toHaveBeenCalledWith(
        "row-123",
        "col-1",
        "user-123",
        "New Value",
        mockReq.file,
      );
      expect(FileUtils.deleteFile).toHaveBeenCalledWith("/tmp/upload.jpg");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Cell upserted successfully",
        data: mockCell,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should clean up file on error and call next", async () => {
      mockReq.params = { rowId: "row-123" };
      mockReq.body = { columnId: "col-1", value: "New Value" };
      mockReq.file = { path: "/tmp/upload.jpg" };

      const error = new Error("Service error");
      mockService.upsertCell.mockRejectedValue(error);

      await controller.upsertCell(mockReq, mockRes, mockNext);

      expect(FileUtils.deleteFile).toHaveBeenCalledWith("/tmp/upload.jpg");
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should handle upsert without file", async () => {
      mockReq.params = { rowId: "row-123" };
      mockReq.body = { columnId: "col-1", value: "New Value" };
      mockReq.file = null;

      const mockCell = {
        id: "cell-1",
        rowId: "row-123",
        columnId: "col-1",
        columnName: "Column 1",
        value: "New Value",
        imageUrl: null,
        cloudinaryPublicId: null,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      };

      mockService.upsertCell.mockResolvedValue(mockCell);

      await controller.upsertCell(mockReq, mockRes, mockNext);

      expect(mockService.upsertCell).toHaveBeenCalledWith(
        "row-123",
        "col-1",
        "user-123",
        "New Value",
        null,
      );
      expect(FileUtils.deleteFile).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Cell upserted successfully",
        data: mockCell,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
