import { describe, it, expect, beforeEach, vi } from "vitest";

import { NotFoundError, ValidationError } from "../../../utils/errors.js";
import ImageCleanupService from "../../../utils/imageCleanupService.js";
import { Validator } from "../../../utils/validator.js";
import { ProjectService } from "../project.service.js";

// Mock uuid
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mocked-project-uuid-123"),
}));

// Mock dependencies
vi.mock("../project.repository.js", () => ({
  default: class MockProjectRepository {
    createProject = vi.fn();
    findProjectById = vi.fn();
    findProjectsByUserId = vi.fn();
    updateProject = vi.fn();
    deleteProject = vi.fn();
    checkProjectOwnership = vi.fn();
  },
}));

vi.mock("../../../utils/imageCleanupService.js", () => ({
  default: {
    deleteImagesByProjectId: vi.fn(),
  },
}));

vi.mock("../../../utils/validator.js", () => ({
  Validator: {
    isValidUUID: vi.fn(),
  },
}));

describe("ProjectService", () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      createProject: vi.fn(),
      findProjectById: vi.fn(),
      findProjectsByUserId: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      checkProjectOwnership: vi.fn(),
    };

    service = new ProjectService();
    service.repository = mockRepository;
  });

  describe("createProject", () => {
    it("should successfully create a new project", async () => {
      const userId = "user-123";
      const projectData = {
        name: "My Project",
        description: "Project description",
      };

      // Mock return berbeda dari expected (ada extra field user)
      const mockCreatedProject = {
        id: "mocked-project-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: "Project description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        user: { id: "user-123", email: "user@example.com" },
      };

      const expectedResult = {
        id: "mocked-project-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: "Project description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      };

      mockRepository.createProject.mockResolvedValue(mockCreatedProject);

      const result = await service.createProject(userId, projectData);

      expect(mockRepository.createProject).toHaveBeenCalledWith({
        id: "mocked-project-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: "Project description",
      });
      expect(result).toEqual(expectedResult);
    });

    it("should create project with null description when not provided", async () => {
      const userId = "user-123";
      const projectData = {
        name: "My Project",
      };

      const mockCreatedProject = {
        id: "mocked-project-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: null,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        user: { id: "user-123", email: "user@example.com" },
      };

      const expectedResult = {
        id: "mocked-project-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: null,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      };

      mockRepository.createProject.mockResolvedValue(mockCreatedProject);

      const result = await service.createProject(userId, projectData);

      expect(mockRepository.createProject).toHaveBeenCalledWith({
        id: "mocked-project-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: null,
      });
      expect(result).toEqual(expectedResult);
    });

    it("should trim project name and description", async () => {
      const userId = "user-123";
      const projectData = {
        name: "  My Project  ",
        description: "  Project description  ",
      };

      const mockCreatedProject = {
        id: "mocked-project-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: "Project description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        user: { id: "user-123", email: "user@example.com" },
      };

      mockRepository.createProject.mockResolvedValue(mockCreatedProject);

      await service.createProject(userId, projectData);

      expect(mockRepository.createProject).toHaveBeenCalledWith({
        id: "mocked-project-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: "Project description",
      });
    });

    it("should throw ValidationError if name is missing", async () => {
      const userId = "user-123";
      const projectData = {
        description: "Project description",
      };

      await expect(service.createProject(userId, projectData)).rejects.toThrow(
        ValidationError,
      );
      await expect(service.createProject(userId, projectData)).rejects.toThrow(
        "Project name is required",
      );

      expect(mockRepository.createProject).not.toHaveBeenCalled();
    });

    it("should throw ValidationError if name is empty string", async () => {
      const userId = "user-123";
      const projectData = {
        name: "   ",
        description: "Project description",
      };

      await expect(service.createProject(userId, projectData)).rejects.toThrow(
        ValidationError,
      );

      expect(mockRepository.createProject).not.toHaveBeenCalled();
    });
  });

  describe("getProjectById", () => {
    it("should successfully get project by id", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";

      // Mock return berbeda dari expected (ada extra fields)
      const mockProject = {
        id: "valid-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: "Project description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        user: { id: "user-123", email: "user@example.com" },
        cmsTables: [
          { id: "table-1", name: "Table 1" },
          { id: "table-2", name: "Table 2" },
        ],
      };

      const expectedResult = {
        id: "valid-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: "Project description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        cmsTables: [
          { id: "table-1", name: "Table 1" },
          { id: "table-2", name: "Table 2" },
        ],
      };

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.findProjectById.mockResolvedValue(mockProject);

      const result = await service.getProjectById(projectId, userId);

      expect(Validator.isValidUUID).toHaveBeenCalledWith(projectId);
      expect(mockRepository.findProjectById).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(expectedResult);
    });

    it("should throw NotFoundError if projectId is not valid UUID", async () => {
      const projectId = "invalid-uuid";
      const userId = "user-123";

      Validator.isValidUUID.mockReturnValue(false);

      await expect(service.getProjectById(projectId, userId)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getProjectById(projectId, userId)).rejects.toThrow(
        "Project not found",
      );

      expect(Validator.isValidUUID).toHaveBeenCalledWith(projectId);
      expect(mockRepository.findProjectById).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if project does not exist", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.findProjectById.mockResolvedValue(null);

      await expect(service.getProjectById(projectId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(Validator.isValidUUID).toHaveBeenCalledWith(projectId);
      expect(mockRepository.findProjectById).toHaveBeenCalledWith(projectId);
    });

    it("should throw NotFoundError if user does not own the project", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";

      const mockProject = {
        id: "valid-uuid-123",
        userId: "other-user-456",
        name: "Other User's Project",
        description: "Description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        cmsTables: [],
      };

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.findProjectById.mockResolvedValue(mockProject);

      await expect(service.getProjectById(projectId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(Validator.isValidUUID).toHaveBeenCalledWith(projectId);
      expect(mockRepository.findProjectById).toHaveBeenCalledWith(projectId);
    });

    it("should return project with empty cmsTables array if none exist", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";

      const mockProject = {
        id: "valid-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: "Project description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        cmsTables: null,
      };

      const expectedResult = {
        id: "valid-uuid-123",
        userId: "user-123",
        name: "My Project",
        description: "Project description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        cmsTables: [],
      };

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.findProjectById.mockResolvedValue(mockProject);

      const result = await service.getProjectById(projectId, userId);

      expect(result).toEqual(expectedResult);
    });
  });

  describe("getUserProjects", () => {
    it("should successfully get all user projects", async () => {
      const userId = "user-123";

      // Mock return berbeda dari expected (ada extra fields)
      const mockProjects = [
        {
          id: "project-1",
          userId: "user-123",
          name: "Project 1",
          description: "Description 1",
          createdAt: new Date("2025-01-15"),
          updatedAt: new Date("2025-01-15"),
          user: { id: "user-123", email: "user@example.com" },
          cmsTables: [{ id: "table-1", name: "Table 1" }],
        },
        {
          id: "project-2",
          userId: "user-123",
          name: "Project 2",
          description: null,
          createdAt: new Date("2025-01-16"),
          updatedAt: new Date("2025-01-16"),
          user: { id: "user-123", email: "user@example.com" },
          cmsTables: [],
        },
      ];

      const expectedResult = [
        {
          id: "project-1",
          userId: "user-123",
          name: "Project 1",
          description: "Description 1",
          createdAt: new Date("2025-01-15"),
          updatedAt: new Date("2025-01-15"),
        },
        {
          id: "project-2",
          userId: "user-123",
          name: "Project 2",
          description: null,
          createdAt: new Date("2025-01-16"),
          updatedAt: new Date("2025-01-16"),
        },
      ];

      mockRepository.findProjectsByUserId.mockResolvedValue(mockProjects);

      const result = await service.getUserProjects(userId);

      expect(mockRepository.findProjectsByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });

    it("should return empty array if user has no projects", async () => {
      const userId = "user-123";

      mockRepository.findProjectsByUserId.mockResolvedValue([]);

      const result = await service.getUserProjects(userId);

      expect(mockRepository.findProjectsByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });
  });

  describe("updateProject", () => {
    it("should successfully update project name and description", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";
      const updateData = {
        name: "Updated Project Name",
        description: "Updated description",
      };

      // Mock return berbeda dari expected (ada extra fields)
      const mockUpdatedProject = {
        id: "valid-uuid-123",
        userId: "user-123",
        name: "Updated Project Name",
        description: "Updated description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-20"),
        user: { id: "user-123", email: "user@example.com" },
      };

      const expectedResult = {
        id: "valid-uuid-123",
        userId: "user-123",
        name: "Updated Project Name",
        description: "Updated description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-20"),
      };

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.checkProjectOwnership.mockResolvedValue(true);
      mockRepository.updateProject.mockResolvedValue(mockUpdatedProject);

      const result = await service.updateProject(projectId, userId, updateData);

      expect(Validator.isValidUUID).toHaveBeenCalledWith(projectId);
      expect(mockRepository.checkProjectOwnership).toHaveBeenCalledWith(
        projectId,
        userId,
      );
      expect(mockRepository.updateProject).toHaveBeenCalledWith(projectId, {
        name: "Updated Project Name",
        description: "Updated description",
      });
      expect(result).toEqual(expectedResult);
    });

    it("should update only name when description not provided", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";
      const updateData = {
        name: "Updated Name Only",
      };

      const mockUpdatedProject = {
        id: "valid-uuid-123",
        userId: "user-123",
        name: "Updated Name Only",
        description: "Old description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-20"),
        user: { id: "user-123", email: "user@example.com" },
      };

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.checkProjectOwnership.mockResolvedValue(true);
      mockRepository.updateProject.mockResolvedValue(mockUpdatedProject);

      await service.updateProject(projectId, userId, updateData);

      expect(mockRepository.updateProject).toHaveBeenCalledWith(projectId, {
        name: "Updated Name Only",
      });
    });

    it("should set description to null when empty string provided", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";
      const updateData = {
        name: "Updated Name",
        description: "",
      };

      const mockUpdatedProject = {
        id: "valid-uuid-123",
        userId: "user-123",
        name: "Updated Name",
        description: null,
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-20"),
        user: { id: "user-123", email: "user@example.com" },
      };

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.checkProjectOwnership.mockResolvedValue(true);
      mockRepository.updateProject.mockResolvedValue(mockUpdatedProject);

      await service.updateProject(projectId, userId, updateData);

      expect(mockRepository.updateProject).toHaveBeenCalledWith(projectId, {
        name: "Updated Name",
        description: null,
      });
    });

    it("should trim name and description before updating", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";
      const updateData = {
        name: "  Updated Name  ",
        description: "  Updated Description  ",
      };

      const mockUpdatedProject = {
        id: "valid-uuid-123",
        userId: "user-123",
        name: "Updated Name",
        description: "Updated Description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-20"),
        user: { id: "user-123", email: "user@example.com" },
      };

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.checkProjectOwnership.mockResolvedValue(true);
      mockRepository.updateProject.mockResolvedValue(mockUpdatedProject);

      await service.updateProject(projectId, userId, updateData);

      expect(mockRepository.updateProject).toHaveBeenCalledWith(projectId, {
        name: "Updated Name",
        description: "Updated Description",
      });
    });

    it("should throw NotFoundError if projectId is not valid UUID", async () => {
      const projectId = "invalid-uuid";
      const userId = "user-123";
      const updateData = { name: "Updated Name" };

      Validator.isValidUUID.mockReturnValue(false);

      await expect(
        service.updateProject(projectId, userId, updateData),
      ).rejects.toThrow(NotFoundError);

      expect(Validator.isValidUUID).toHaveBeenCalledWith(projectId);
      expect(mockRepository.checkProjectOwnership).not.toHaveBeenCalled();
      expect(mockRepository.updateProject).not.toHaveBeenCalled();
    });

    it("should throw ValidationError if name is empty string", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";
      const updateData = {
        name: "   ",
      };

      Validator.isValidUUID.mockReturnValue(true);

      await expect(
        service.updateProject(projectId, userId, updateData),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.updateProject(projectId, userId, updateData),
      ).rejects.toThrow("Project name cannot be empty");

      expect(mockRepository.checkProjectOwnership).not.toHaveBeenCalled();
      expect(mockRepository.updateProject).not.toHaveBeenCalled();
    });

    it("should throw ValidationError if description exceeds 500 characters", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";
      const updateData = {
        name: "Updated Name",
        description: "a".repeat(501),
      };

      Validator.isValidUUID.mockReturnValue(true);

      await expect(
        service.updateProject(projectId, userId, updateData),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.updateProject(projectId, userId, updateData),
      ).rejects.toThrow("Project description must not exceed 500 characters");

      expect(mockRepository.checkProjectOwnership).not.toHaveBeenCalled();
      expect(mockRepository.updateProject).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if user does not own the project", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";
      const updateData = { name: "Updated Name" };

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.checkProjectOwnership.mockResolvedValue(false);

      await expect(
        service.updateProject(projectId, userId, updateData),
      ).rejects.toThrow(NotFoundError);

      expect(Validator.isValidUUID).toHaveBeenCalledWith(projectId);
      expect(mockRepository.checkProjectOwnership).toHaveBeenCalledWith(
        projectId,
        userId,
      );
      expect(mockRepository.updateProject).not.toHaveBeenCalled();
    });
  });

  describe("deleteProject", () => {
    it("should successfully delete project and its images", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.checkProjectOwnership.mockResolvedValue(true);
      ImageCleanupService.deleteImagesByProjectId.mockResolvedValue(true);
      mockRepository.deleteProject.mockResolvedValue({
        id: projectId,
        name: "Deleted Project",
      });

      const result = await service.deleteProject(projectId, userId);

      expect(Validator.isValidUUID).toHaveBeenCalledWith(projectId);
      expect(mockRepository.checkProjectOwnership).toHaveBeenCalledWith(
        projectId,
        userId,
      );
      expect(ImageCleanupService.deleteImagesByProjectId).toHaveBeenCalledWith(
        projectId,
      );
      expect(mockRepository.deleteProject).toHaveBeenCalledWith(projectId);
      expect(result).toEqual({ message: "Project deleted successfully" });
    });

    it("should throw NotFoundError if projectId is not valid UUID", async () => {
      const projectId = "invalid-uuid";
      const userId = "user-123";

      Validator.isValidUUID.mockReturnValue(false);

      await expect(service.deleteProject(projectId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(Validator.isValidUUID).toHaveBeenCalledWith(projectId);
      expect(mockRepository.checkProjectOwnership).not.toHaveBeenCalled();
      expect(
        ImageCleanupService.deleteImagesByProjectId,
      ).not.toHaveBeenCalled();
      expect(mockRepository.deleteProject).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError if user does not own the project", async () => {
      const projectId = "valid-uuid-123";
      const userId = "user-123";

      Validator.isValidUUID.mockReturnValue(true);
      mockRepository.checkProjectOwnership.mockResolvedValue(false);

      await expect(service.deleteProject(projectId, userId)).rejects.toThrow(
        NotFoundError,
      );

      expect(Validator.isValidUUID).toHaveBeenCalledWith(projectId);
      expect(mockRepository.checkProjectOwnership).toHaveBeenCalledWith(
        projectId,
        userId,
      );
      expect(
        ImageCleanupService.deleteImagesByProjectId,
      ).not.toHaveBeenCalled();
      expect(mockRepository.deleteProject).not.toHaveBeenCalled();
    });
  });

  describe("validateUUID", () => {
    it("should not throw error for valid UUID", () => {
      Validator.isValidUUID.mockReturnValue(true);

      expect(() => service.validateUUID("valid-uuid-123")).not.toThrow();

      expect(Validator.isValidUUID).toHaveBeenCalledWith("valid-uuid-123");
    });

    it("should throw NotFoundError for invalid UUID", () => {
      Validator.isValidUUID.mockReturnValue(false);

      expect(() => service.validateUUID("invalid-uuid")).toThrow(NotFoundError);
      expect(() => service.validateUUID("invalid-uuid")).toThrow(
        "ID not found",
      );

      expect(Validator.isValidUUID).toHaveBeenCalledWith("invalid-uuid");
    });

    it("should throw NotFoundError with custom field name", () => {
      Validator.isValidUUID.mockReturnValue(false);

      expect(() => service.validateUUID("invalid-uuid", "Project")).toThrow(
        "Project not found",
      );

      expect(Validator.isValidUUID).toHaveBeenCalledWith("invalid-uuid");
    });

    it("should throw NotFoundError for null or undefined UUID", () => {
      Validator.isValidUUID.mockReturnValue(false);

      expect(() => service.validateUUID(null)).toThrow(NotFoundError);
      expect(() => service.validateUUID(undefined)).toThrow(NotFoundError);
    });
  });
});
