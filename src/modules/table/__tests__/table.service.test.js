import { describe, it, expect, beforeEach, vi } from "vitest";

import { ValidationError, TableNotFoundError } from "../../../utils/errors.js";
import ImageCleanupService from "../../../utils/imageCleanupService.js";
import { TableService } from "../table.service.js";

// Mock uuid
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mocked-uuid-123"),
}));

// Mock dependencies
vi.mock("../table.repository.js", () => ({
  default: class MockTableRepository {
    checkProjectOwnership = vi.fn();
    createTable = vi.fn();
    findTablesByProjectId = vi.fn();
    findTableById = vi.fn();
    checkTableOwnership = vi.fn();
    updateTable = vi.fn();
    deleteTable = vi.fn();
  },
}));

vi.mock("../../../utils/imageCleanupService.js", () => ({
  default: {
    deleteImagesByTableId: vi.fn(),
  },
}));

describe("TableService", () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TableService();
    mockRepository = service.repository;
  });

  describe("createTable", () => {
    const projectId = "project-123";
    const userId = "user-123";
    const validData = {
      name: "Test Table",
      isSubTable: false,
    };

    it("should create a table successfully with valid data", async () => {
      mockRepository.checkProjectOwnership.mockResolvedValue(true);
      mockRepository.createTable.mockResolvedValue({
        id: "mocked-uuid-123",
        projectId,
        name: "Test Table",
        isSubTable: false,
        columns: [],
        rows: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createTable(projectId, userId, validData);

      expect(mockRepository.checkProjectOwnership).toHaveBeenCalledWith(
        projectId,
        userId,
      );
      expect(mockRepository.createTable).toHaveBeenCalledWith({
        id: "mocked-uuid-123",
        projectId,
        name: "Test Table",
        isSubTable: false,
      });
      expect(result).toMatchObject({
        id: "mocked-uuid-123",
        projectId,
        name: "Test Table",
        isSubTable: false,
        columnCount: 0,
        rowCount: 0,
      });
    });

    it("should create a table with isSubTable defaulting to false", async () => {
      mockRepository.checkProjectOwnership.mockResolvedValue(true);
      mockRepository.createTable.mockResolvedValue({
        id: "mocked-uuid-123",
        projectId,
        name: "Test Table",
        isSubTable: false,
        columns: [],
        rows: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dataWithoutIsSubTable = { name: "Test Table" };
      const _result = await service.createTable(
        projectId,
        userId,
        dataWithoutIsSubTable,
      );

      expect(mockRepository.createTable).toHaveBeenCalledWith(
        expect.objectContaining({
          isSubTable: false,
        }),
      );
    });

    it("should trim the table name before creating", async () => {
      mockRepository.checkProjectOwnership.mockResolvedValue(true);
      mockRepository.createTable.mockResolvedValue({
        id: "mocked-uuid-123",
        projectId,
        name: "Trimmed Table",
        isSubTable: false,
        columns: [],
        rows: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dataWithSpaces = { name: "  Trimmed Table  " };
      await service.createTable(projectId, userId, dataWithSpaces);

      expect(mockRepository.createTable).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Trimmed Table",
        }),
      );
    });

    it("should throw ValidationError if name is empty", async () => {
      const dataWithEmptyName = { name: "" };

      await expect(
        service.createTable(projectId, userId, dataWithEmptyName),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.createTable(projectId, userId, dataWithEmptyName),
      ).rejects.toThrow("Table name is required");
    });

    it("should throw ValidationError if name is only whitespace", async () => {
      const dataWithWhitespaceName = { name: "   " };

      await expect(
        service.createTable(projectId, userId, dataWithWhitespaceName),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError if name is missing", async () => {
      const dataWithoutName = { isSubTable: false };

      await expect(
        service.createTable(projectId, userId, dataWithoutName),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw TableNotFoundError if project does not exist", async () => {
      mockRepository.checkProjectOwnership.mockResolvedValue(false);

      await expect(
        service.createTable(projectId, userId, validData),
      ).rejects.toThrow(TableNotFoundError);
      await expect(
        service.createTable(projectId, userId, validData),
      ).rejects.toThrow("Project not found");
    });

    it("should throw TableNotFoundError if user does not own the project", async () => {
      mockRepository.checkProjectOwnership.mockResolvedValue(false);

      await expect(
        service.createTable(projectId, "wrong-user-id", validData),
      ).rejects.toThrow(TableNotFoundError);
    });
  });

  describe("getUserTablesByProject", () => {
    const projectId = "project-123";
    const userId = "user-123";

    it("should return all tables for a project", async () => {
      mockRepository.checkProjectOwnership.mockResolvedValue(true);
      mockRepository.findTablesByProjectId.mockResolvedValue([
        {
          id: "table-1",
          projectId,
          name: "Table 1",
          isSubTable: false,
          columns: [{ id: "col-1" }, { id: "col-2" }],
          rows: [{ id: "row-1" }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "table-2",
          projectId,
          name: "Table 2",
          isSubTable: true,
          columns: [{ id: "col-3" }],
          rows: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getUserTablesByProject(projectId, userId);

      expect(mockRepository.checkProjectOwnership).toHaveBeenCalledWith(
        projectId,
        userId,
      );
      expect(mockRepository.findTablesByProjectId).toHaveBeenCalledWith(
        projectId,
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "table-1",
        name: "Table 1",
        columnCount: 2,
        rowCount: 1,
      });
      expect(result[1]).toMatchObject({
        id: "table-2",
        name: "Table 2",
        columnCount: 1,
        rowCount: 0,
      });
    });

    it("should return empty array if no tables exist", async () => {
      mockRepository.checkProjectOwnership.mockResolvedValue(true);
      mockRepository.findTablesByProjectId.mockResolvedValue([]);

      const result = await service.getUserTablesByProject(projectId, userId);

      expect(result).toEqual([]);
    });

    it("should throw TableNotFoundError if project does not exist", async () => {
      mockRepository.checkProjectOwnership.mockResolvedValue(false);

      await expect(
        service.getUserTablesByProject(projectId, userId),
      ).rejects.toThrow(TableNotFoundError);
    });
  });

  describe("getTableById", () => {
    const tableId = "table-123";
    const userId = "user-123";

    it("should return table with full data", async () => {
      const mockTable = {
        id: tableId,
        projectId: "project-123",
        name: "Test Table",
        isSubTable: false,
        project: { userId },
        columns: [
          {
            id: "col-1",
            name: "Column 1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        rows: [
          {
            id: "row-1",
            createdAt: new Date(),
            updatedAt: new Date(),
            cells: [
              {
                id: "cell-1",
                columnId: "col-1",
                value: "Value 1",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findTableById.mockResolvedValue(mockTable);

      const result = await service.getTableById(tableId, userId);

      expect(mockRepository.findTableById).toHaveBeenCalledWith(tableId);
      expect(result).toMatchObject({
        id: tableId,
        name: "Test Table",
        columns: expect.arrayContaining([
          expect.objectContaining({ id: "col-1", name: "Column 1" }),
        ]),
        rows: expect.arrayContaining([
          expect.objectContaining({
            id: "row-1",
            cells: expect.arrayContaining([
              expect.objectContaining({ id: "cell-1", value: "Value 1" }),
            ]),
          }),
        ]),
      });
    });

    it("should throw TableNotFoundError if table does not exist", async () => {
      mockRepository.findTableById.mockResolvedValue(null);

      await expect(service.getTableById(tableId, userId)).rejects.toThrow(
        TableNotFoundError,
      );
    });

    it("should throw TableNotFoundError if user does not own the table", async () => {
      const mockTable = {
        id: tableId,
        projectId: "project-123",
        name: "Test Table",
        project: { userId: "different-user-id" },
        columns: [],
        rows: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findTableById.mockResolvedValue(mockTable);

      await expect(service.getTableById(tableId, userId)).rejects.toThrow(
        TableNotFoundError,
      );
    });
  });

  describe("updateTable", () => {
    const tableId = "table-123";
    const userId = "user-123";

    it("should update table name successfully", async () => {
      mockRepository.checkTableOwnership.mockResolvedValue(true);
      mockRepository.updateTable.mockResolvedValue({
        id: tableId,
        projectId: "project-123",
        name: "Updated Name",
        isSubTable: false,
        columns: [],
        rows: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateTable(tableId, userId, {
        name: "Updated Name",
      });

      expect(mockRepository.checkTableOwnership).toHaveBeenCalledWith(
        tableId,
        userId,
      );
      expect(mockRepository.updateTable).toHaveBeenCalledWith(tableId, {
        name: "Updated Name",
      });
      expect(result.name).toBe("Updated Name");
    });

    it("should trim the updated table name", async () => {
      mockRepository.checkTableOwnership.mockResolvedValue(true);
      mockRepository.updateTable.mockResolvedValue({
        id: tableId,
        projectId: "project-123",
        name: "Trimmed Name",
        isSubTable: false,
        columns: [],
        rows: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.updateTable(tableId, userId, {
        name: "  Trimmed Name  ",
      });

      expect(mockRepository.updateTable).toHaveBeenCalledWith(tableId, {
        name: "Trimmed Name",
      });
    });

    it("should update with empty name (validation only checks if name exists and is trimmed empty)", async () => {
      // Note: Service validation is `if (data.name && data.name.trim() === "")`
      // Empty string "" is falsy, so this validation doesn't trigger for ""
      // It only triggers for strings like "   " (whitespace only)
      mockRepository.checkTableOwnership.mockResolvedValue(true);
      mockRepository.updateTable.mockResolvedValue({
        id: tableId,
        projectId: "project-123",
        name: "",
        isSubTable: false,
        columns: [],
        rows: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateTable(tableId, userId, { name: "" });

      // Since "" is falsy, the validation doesn't run and update proceeds
      expect(mockRepository.updateTable).toHaveBeenCalledWith(tableId, {});
      expect(result.name).toBe("");
    });

    it("should throw ValidationError if name is only whitespace", async () => {
      mockRepository.checkTableOwnership.mockResolvedValue(true);

      await expect(
        service.updateTable(tableId, userId, { name: "   " }),
      ).rejects.toThrow(ValidationError);
    });

    it("should throw TableNotFoundError if table does not exist", async () => {
      mockRepository.checkTableOwnership.mockResolvedValue(false);

      await expect(
        service.updateTable(tableId, userId, { name: "New Name" }),
      ).rejects.toThrow(TableNotFoundError);
    });

    it("should throw TableNotFoundError if user does not own the table", async () => {
      mockRepository.checkTableOwnership.mockResolvedValue(false);

      await expect(
        service.updateTable(tableId, "wrong-user-id", { name: "New Name" }),
      ).rejects.toThrow(TableNotFoundError);
    });
  });

  describe("deleteTable", () => {
    const tableId = "table-123";
    const userId = "user-123";

    it("should delete table and cleanup images", async () => {
      mockRepository.checkTableOwnership.mockResolvedValue(true);
      mockRepository.deleteTable.mockResolvedValue(undefined);

      await service.deleteTable(tableId, userId);

      expect(mockRepository.checkTableOwnership).toHaveBeenCalledWith(
        tableId,
        userId,
      );
      expect(ImageCleanupService.deleteImagesByTableId).toHaveBeenCalledWith(
        tableId,
      );
      expect(mockRepository.deleteTable).toHaveBeenCalledWith(tableId);
    });

    it("should cleanup images before deleting table", async () => {
      mockRepository.checkTableOwnership.mockResolvedValue(true);
      const callOrder = [];

      ImageCleanupService.deleteImagesByTableId.mockImplementation(() => {
        callOrder.push("cleanup");
        return Promise.resolve();
      });

      mockRepository.deleteTable.mockImplementation(() => {
        callOrder.push("delete");
        return Promise.resolve();
      });

      await service.deleteTable(tableId, userId);

      expect(callOrder).toEqual(["cleanup", "delete"]);
    });

    it("should throw TableNotFoundError if table does not exist", async () => {
      mockRepository.checkTableOwnership.mockResolvedValue(false);

      await expect(service.deleteTable(tableId, userId)).rejects.toThrow(
        TableNotFoundError,
      );
    });

    it("should throw TableNotFoundError if user does not own the table", async () => {
      mockRepository.checkTableOwnership.mockResolvedValue(false);

      await expect(
        service.deleteTable(tableId, "wrong-user-id"),
      ).rejects.toThrow(TableNotFoundError);
    });
  });

  describe("_formatTable", () => {
    it("should format table correctly with columns and rows", () => {
      const table = {
        id: "table-123",
        projectId: "project-123",
        name: "Test Table",
        isSubTable: false,
        columns: [{ id: "col-1" }, { id: "col-2" }],
        rows: [{ id: "row-1" }, { id: "row-2" }, { id: "row-3" }],
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
      };

      const result = service._formatTable(table);

      expect(result).toEqual({
        id: "table-123",
        projectId: "project-123",
        name: "Test Table",
        isSubTable: false,
        columnCount: 2,
        rowCount: 3,
        createdAt: table.createdAt,
        updatedAt: table.updatedAt,
      });
    });

    it("should handle table without columns and rows", () => {
      const table = {
        id: "table-123",
        projectId: "project-123",
        name: "Empty Table",
        isSubTable: true,
        columns: null,
        rows: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service._formatTable(table);

      expect(result.columnCount).toBe(0);
      expect(result.rowCount).toBe(0);
    });
  });

  describe("_isValidUUID", () => {
    it("should return true for valid UUIDs", () => {
      const validUUIDs = [
        "123e4567-e89b-12d3-a456-426614174000",
        "550e8400-e29b-41d4-a716-446655440000",
        "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
      ];

      validUUIDs.forEach((uuid) => {
        expect(service._isValidUUID(uuid)).toBe(true);
      });
    });

    it("should return false for invalid UUIDs", () => {
      const invalidUUIDs = [
        "not-a-uuid",
        "123e4567-e89b-12d3-a456",
        "123e4567-e89b-12d3-a456-426614174000-extra",
        "",
        null,
        undefined,
        123,
        {},
      ];

      invalidUUIDs.forEach((uuid) => {
        expect(service._isValidUUID(uuid)).toBe(false);
      });
    });
  });

  describe("getTableSimplified", () => {
    const tableId = "table-123";
    const userId = "user-123";

    it("should return simplified table format", async () => {
      const mockTable = {
        id: tableId,
        projectId: "project-123",
        name: "Test Table",
        isSubTable: false,
        project: { userId },
        columns: [
          { id: "col-1", name: "First Name" },
          { id: "col-2", name: "Last Name" },
        ],
        rows: [
          {
            id: "row-1",
            cells: [
              { id: "cell-1", columnId: "col-1", value: "John" },
              { id: "cell-2", columnId: "col-2", value: "Doe" },
            ],
          },
          {
            id: "row-2",
            cells: [
              { id: "cell-3", columnId: "col-1", value: "Jane" },
              { id: "cell-4", columnId: "col-2", value: "Smith" },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findTableById.mockResolvedValue(mockTable);

      const result = await service.getTableSimplified(tableId, userId);

      expect(result).toEqual({
        name: "Test Table",
        cells: [
          { first_name: "John", last_name: "Doe" },
          { first_name: "Jane", last_name: "Smith" },
        ],
      });
    });

    it("should normalize column names with underscores", async () => {
      const mockTable = {
        id: tableId,
        projectId: "project-123",
        name: "Test Table",
        project: { userId },
        columns: [
          { id: "col-1", name: "Full Name" },
          { id: "col-2", name: "Email Address" },
        ],
        rows: [
          {
            id: "row-1",
            cells: [
              { id: "cell-1", columnId: "col-1", value: "John Doe" },
              { id: "cell-2", columnId: "col-2", value: "john@example.com" },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findTableById.mockResolvedValue(mockTable);

      const result = await service.getTableSimplified(tableId, userId);

      expect(result.cells[0]).toHaveProperty("full_name", "John Doe");
      expect(result.cells[0]).toHaveProperty(
        "email_address",
        "john@example.com",
      );
    });

    it("should handle table references in cell values", async () => {
      const referencedTableId = "550e8400-e29b-41d4-a716-446655440000";
      const mockMainTable = {
        id: tableId,
        projectId: "project-123",
        name: "Main Table",
        project: { userId },
        columns: [
          { id: "col-1", name: "Name" },
          { id: "col-2", name: "Reference" },
        ],
        rows: [
          {
            id: "row-1",
            cells: [
              { id: "cell-1", columnId: "col-1", value: "Main" },
              { id: "cell-2", columnId: "col-2", value: referencedTableId },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReferencedTable = {
        id: referencedTableId,
        projectId: "project-123",
        name: "Referenced Table",
        project: { userId },
        columns: [{ id: "col-3", name: "Data" }],
        rows: [
          {
            id: "row-2",
            cells: [
              { id: "cell-3", columnId: "col-3", value: "Referenced Value" },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock to return correct table based on ID
      mockRepository.findTableById.mockImplementation((id) => {
        if (id === tableId) return Promise.resolve(mockMainTable);
        if (id === referencedTableId)
          return Promise.resolve(mockReferencedTable);
        return Promise.resolve(null);
      });

      const result = await service.getTableSimplified(tableId, userId);

      // Verify the main table structure
      expect(result.name).toBe("Main Table");
      expect(result.cells[0].name).toBe("Main");

      // Referenced table should be resolved
      expect(result.cells[0].reference).toEqual({
        name: "Referenced Table",
        cells: [{ data: "Referenced Value" }],
      });
    });

    it("should prevent infinite loops in circular references", async () => {
      const tableAId = "aaaaaaaa-bbbb-cccc-dddd-000000000001";
      const tableBId = "bbbbbbbb-cccc-dddd-eeee-000000000002";

      const mockTableA = {
        id: tableAId,
        projectId: "project-123",
        name: "Table A",
        project: { userId },
        columns: [{ id: "col-1", name: "Ref" }],
        rows: [
          {
            id: "row-1",
            cells: [{ id: "cell-1", columnId: "col-1", value: tableBId }],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTableB = {
        id: tableBId,
        projectId: "project-123",
        name: "Table B",
        project: { userId },
        columns: [{ id: "col-2", name: "Ref" }],
        rows: [
          {
            id: "row-2",
            cells: [{ id: "cell-2", columnId: "col-2", value: tableAId }],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock to return tables based on ID
      mockRepository.findTableById.mockImplementation((id) => {
        if (id === tableAId) return Promise.resolve(mockTableA);
        if (id === tableBId) return Promise.resolve(mockTableB);
        return Promise.resolve(null);
      });

      const result = await service.getTableSimplified(tableAId, userId);

      // Should resolve table B, but when Table B tries to resolve back to A,
      // it should stop due to visited tracking
      expect(result.name).toBe("Table A");
      expect(result.cells[0].ref).toMatchObject({
        name: "Table B",
        cells: [
          {
            ref: expect.objectContaining({
              name: "Table A",
              // Inner Table A should have Table B as unresolved ID (circular stopped)
              cells: [{ ref: tableBId }],
            }),
          },
        ],
      });
    });

    it("should throw TableNotFoundError if table does not exist", async () => {
      mockRepository.findTableById.mockResolvedValue(null);

      await expect(service.getTableSimplified(tableId, userId)).rejects.toThrow(
        TableNotFoundError,
      );
    });

    it("should throw TableNotFoundError if user does not own the table", async () => {
      const mockTable = {
        id: tableId,
        project: { userId: "different-user-id" },
        columns: [],
        rows: [],
      };

      mockRepository.findTableById.mockResolvedValue(mockTable);

      await expect(service.getTableSimplified(tableId, userId)).rejects.toThrow(
        TableNotFoundError,
      );
    });
  });

  describe("_resolveTableReference", () => {
    const userId = "user-123";

    it("should return original value if not a valid UUID", async () => {
      const result = await service._resolveTableReference("not-a-uuid", userId);
      expect(result).toBe("not-a-uuid");
    });

    it("should return original value if table not found", async () => {
      const tableId = "123e4567-e89b-12d3-a456-426614174000";
      mockRepository.findTableById.mockResolvedValue(null);

      const result = await service._resolveTableReference(tableId, userId);
      expect(result).toBe(tableId);
    });

    it("should return original value if user does not own referenced table", async () => {
      const tableId = "123e4567-e89b-12d3-a456-426614174000";
      mockRepository.findTableById.mockResolvedValue({
        id: tableId,
        project: { userId: "different-user-id" },
      });

      const result = await service._resolveTableReference(tableId, userId);
      expect(result).toBe(tableId);
    });

    it("should return original value if already visited (circular reference)", async () => {
      const tableId = "123e4567-e89b-12d3-a456-426614174000";
      const visitedSet = new Set([tableId]);

      const result = await service._resolveTableReference(
        tableId,
        userId,
        visitedSet,
      );
      expect(result).toBe(tableId);
    });
  });
});
