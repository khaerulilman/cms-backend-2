import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock dependencies
vi.mock("../table.service.js", () => ({
  default: class MockTableService {
    createTable = vi.fn();
    getUserTablesByProject = vi.fn();
    getTableById = vi.fn();
    updateTable = vi.fn();
    deleteTable = vi.fn();
    getTableSimplified = vi.fn();
  },
}));

// Import after mocks are set up
import { TableController } from "../table.controller.js";

describe("TableController", () => {
  let controller;
  let mockService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new TableController();
    mockService = controller.service;

    // Mock request object
    mockReq = {
      user: { id: "user-123" },
      body: {},
      params: {},
    };

    // Mock response object
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = vi.fn();
  });

  describe("createTable", () => {
    it("should create a table successfully with valid data", async () => {
      mockReq.body = {
        projectId: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test Table",
        isSubTable: false,
      };

      // Mock return value - nilai netral dari service
      mockService.createTable.mockResolvedValue({
        id: "table-123",
        projectId: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test Table",
        isSubTable: false,
        columnCount: 0,
        rowCount: 0,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      });

      await controller.createTable(mockReq, mockRes, mockNext);

      // Verify service was called correctly
      expect(mockService.createTable).toHaveBeenCalledWith(
        "123e4567-e89b-12d3-a456-426614174000",
        "user-123",
        {
          name: "Test Table",
          isSubTable: false,
        },
      );
      expect(mockService.createTable).toHaveBeenCalledTimes(1);

      // Verify response structure - expected value terpisah dari mock
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Table created successfully",
        data: expect.objectContaining({
          id: "table-123",
          projectId: "123e4567-e89b-12d3-a456-426614174000",
          name: "Test Table",
          isSubTable: false,
          columnCount: 0,
          rowCount: 0,
        }),
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid projectId (not UUID)", async () => {
      mockReq.body = {
        projectId: "invalid-id",
        name: "Test Table",
      };

      await controller.createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "projectId",
            message: expect.stringContaining("UUID"),
          }),
        ]),
      });
      expect(mockService.createTable).not.toHaveBeenCalled();
    });

    it("should return 400 for empty table name", async () => {
      mockReq.body = {
        projectId: "123e4567-e89b-12d3-a456-426614174000",
        name: "",
      };

      await controller.createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "name",
          }),
        ]),
      });
    });

    it("should return 400 for missing required fields", async () => {
      mockReq.body = {
        // Missing projectId and name
      };

      await controller.createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: expect.any(Array),
      });
    });

    it("should return 400 for invalid isSubTable type", async () => {
      mockReq.body = {
        projectId: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test Table",
        isSubTable: "not-a-boolean",
      };

      await controller.createTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "isSubTable",
          }),
        ]),
      });
    });

    it("should call next with error if service throws", async () => {
      mockReq.body = {
        projectId: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test Table",
      };

      const error = new Error("Service error");
      mockService.createTable.mockRejectedValue(error);

      await controller.createTable(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("getTablesByProject", () => {
    it("should retrieve all tables for a project", async () => {
      mockReq.params = { projectId: "project-123" };

      // Mock return value - nilai netral dari service
      mockService.getUserTablesByProject.mockResolvedValue([
        {
          id: "table-1",
          projectId: "project-123",
          name: "Table 1",
          columnCount: 2,
          rowCount: 5,
        },
        {
          id: "table-2",
          projectId: "project-123",
          name: "Table 2",
          columnCount: 3,
          rowCount: 10,
        },
      ]);

      await controller.getTablesByProject(mockReq, mockRes, mockNext);

      // Verify all mocked functions
      expect(mockService.getUserTablesByProject).toHaveBeenCalledWith(
        "project-123",
        "user-123",
      );
      expect(mockService.getUserTablesByProject).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Tables retrieved successfully",
        data: expect.arrayContaining([
          expect.objectContaining({ id: "table-1", name: "Table 1" }),
          expect.objectContaining({ id: "table-2", name: "Table 2" }),
        ]),
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      mockReq.params = { projectId: "project-123" };
      const error = new Error("Service error");
      mockService.getUserTablesByProject.mockRejectedValue(error);

      await controller.getTablesByProject(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getTableById", () => {
    it("should retrieve a table by id", async () => {
      mockReq.params = { tableId: "table-123" };

      // Mock return value - nilai netral dari service
      mockService.getTableById.mockResolvedValue({
        id: "table-123",
        projectId: "project-123",
        name: "Test Table",
        columns: [{ id: "col-1", name: "Column 1" }],
        rows: [
          {
            id: "row-1",
            cells: [{ id: "cell-1", columnId: "col-1", value: "Value 1" }],
          },
        ],
      });

      await controller.getTableById(mockReq, mockRes, mockNext);

      // Verify all mocked functions
      expect(mockService.getTableById).toHaveBeenCalledWith(
        "table-123",
        "user-123",
      );
      expect(mockService.getTableById).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Table retrieved successfully",
        data: expect.objectContaining({
          id: "table-123",
          name: "Test Table",
        }),
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      mockReq.params = { tableId: "table-123" };
      const error = new Error("Service error");
      mockService.getTableById.mockRejectedValue(error);

      await controller.getTableById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateTable", () => {
    it("should update a table successfully with valid data", async () => {
      mockReq.params = { tableId: "table-123" };
      mockReq.body = { name: "Updated Table Name" };

      // Mock return value - nilai netral dari service
      mockService.updateTable.mockResolvedValue({
        id: "table-123",
        projectId: "project-123",
        name: "Updated Table Name",
        columnCount: 2,
        rowCount: 5,
      });

      await controller.updateTable(mockReq, mockRes, mockNext);

      // Verify all mocked functions
      expect(mockService.updateTable).toHaveBeenCalledWith(
        "table-123",
        "user-123",
        { name: "Updated Table Name" },
      );
      expect(mockService.updateTable).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Table updated successfully",
        data: expect.objectContaining({
          id: "table-123",
          name: "Updated Table Name",
        }),
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 400 for empty table name", async () => {
      mockReq.params = { tableId: "table-123" };
      mockReq.body = { name: "" };

      await controller.updateTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: expect.any(Array),
      });
      expect(mockService.updateTable).not.toHaveBeenCalled();
    });

    it("should return 400 for missing name field", async () => {
      mockReq.params = { tableId: "table-123" };
      mockReq.body = {};

      await controller.updateTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "name",
          }),
        ]),
      });
    });

    it("should return 400 for name exceeding max length", async () => {
      mockReq.params = { tableId: "table-123" };
      mockReq.body = { name: "a".repeat(256) }; // 256 characters, max is 255

      await controller.updateTable(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "name",
            message: expect.stringContaining("255"),
          }),
        ]),
      });
    });

    it("should call next with error if service throws", async () => {
      mockReq.params = { tableId: "table-123" };
      mockReq.body = { name: "Updated Name" };
      const error = new Error("Service error");
      mockService.updateTable.mockRejectedValue(error);

      await controller.updateTable(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteTable", () => {
    it("should delete a table successfully", async () => {
      mockReq.params = { tableId: "table-123" };

      mockService.deleteTable.mockResolvedValue(undefined);

      await controller.deleteTable(mockReq, mockRes, mockNext);

      // Verify all mocked functions
      expect(mockService.deleteTable).toHaveBeenCalledWith(
        "table-123",
        "user-123",
      );
      expect(mockService.deleteTable).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Table deleted successfully",
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      mockReq.params = { tableId: "table-123" };
      const error = new Error("Service error");
      mockService.deleteTable.mockRejectedValue(error);

      await controller.deleteTable(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getTableSimplified", () => {
    it("should retrieve simplified table format", async () => {
      mockReq.params = { tableId: "table-123" };

      // Mock return value - nilai netral dari service
      mockService.getTableSimplified.mockResolvedValue({
        name: "Test Table",
        cells: [
          { first_name: "John", last_name: "Doe" },
          { first_name: "Jane", last_name: "Smith" },
        ],
      });

      await controller.getTableSimplified(mockReq, mockRes, mockNext);

      // Verify all mocked functions
      expect(mockService.getTableSimplified).toHaveBeenCalledWith(
        "table-123",
        "user-123",
      );
      expect(mockService.getTableSimplified).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.status).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Table retrieved successfully",
        data: expect.objectContaining({
          name: "Test Table",
          cells: expect.any(Array),
        }),
      });
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      mockReq.params = { tableId: "table-123" };
      const error = new Error("Service error");
      mockService.getTableSimplified.mockRejectedValue(error);

      await controller.getTableSimplified(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
