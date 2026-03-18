import { describe, it, expect, beforeEach, vi } from "vitest";

import prisma from "../../../prisma/client.js";
import { ProjectRepository } from "../project.repository.js";

// Mock prisma client
vi.mock("../../../prisma/client.js", () => ({
  default: {
    project: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("ProjectRepository", () => {
  let repository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ProjectRepository();
  });

  describe("createProject", () => {
    it("should create project with user relation", async () => {
      const projectData = {
        id: "project-123",
        userId: "user-123",
        name: "Test Project",
        description: "Test description",
      };

      // Mock return berbeda dari input (ada extra field dari include)
      const mockCreatedProject = {
        id: "project-123",
        userId: "user-123",
        name: "Test Project",
        description: "Test description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        user: {
          id: "user-123",
          email: "user@example.com",
          name: "Test User",
        },
      };

      prisma.project.create.mockResolvedValue(mockCreatedProject);

      const result = await repository.createProject(projectData);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: projectData,
        include: {
          user: true,
        },
      });
      expect(result).toEqual(mockCreatedProject);
    });
  });

  describe("findProjectById", () => {
    it("should find project by id with user and cmsTables", async () => {
      const projectId = "project-123";

      const mockProject = {
        id: "project-123",
        userId: "user-123",
        name: "Test Project",
        description: "Test description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        user: {
          id: "user-123",
          email: "user@example.com",
        },
        cmsTables: [
          { id: "table-1", name: "Table 1" },
          { id: "table-2", name: "Table 2" },
        ],
      };

      prisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await repository.findProjectById(projectId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        include: {
          user: true,
          cmsTables: true,
        },
      });
      expect(result).toEqual(mockProject);
    });

    it("should return null if project not found", async () => {
      const projectId = "non-existent";

      prisma.project.findUnique.mockResolvedValue(null);

      const result = await repository.findProjectById(projectId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        include: {
          user: true,
          cmsTables: true,
        },
      });
      expect(result).toBeNull();
    });
  });

  describe("findProjectsByUserId", () => {
    it("should find all projects by user id ordered by createdAt desc", async () => {
      const userId = "user-123";

      const mockProjects = [
        {
          id: "project-2",
          userId: "user-123",
          name: "Recent Project",
          description: "Recent",
          createdAt: new Date("2025-01-16"),
          updatedAt: new Date("2025-01-16"),
          user: { id: "user-123", email: "user@example.com" },
          cmsTables: [],
        },
        {
          id: "project-1",
          userId: "user-123",
          name: "Old Project",
          description: "Old",
          createdAt: new Date("2025-01-15"),
          updatedAt: new Date("2025-01-15"),
          user: { id: "user-123", email: "user@example.com" },
          cmsTables: [{ id: "table-1", name: "Table 1" }],
        },
      ];

      prisma.project.findMany.mockResolvedValue(mockProjects);

      const result = await repository.findProjectsByUserId(userId);

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          user: true,
          cmsTables: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockProjects);
    });

    it("should return empty array if user has no projects", async () => {
      const userId = "user-123";

      prisma.project.findMany.mockResolvedValue([]);

      const result = await repository.findProjectsByUserId(userId);

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          user: true,
          cmsTables: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual([]);
    });
  });

  describe("updateProject", () => {
    it("should update project with new data", async () => {
      const projectId = "project-123";
      const updateData = {
        name: "Updated Name",
        description: "Updated description",
      };

      const mockUpdatedProject = {
        id: "project-123",
        userId: "user-123",
        name: "Updated Name",
        description: "Updated description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-20"),
        user: {
          id: "user-123",
          email: "user@example.com",
        },
      };

      prisma.project.update.mockResolvedValue(mockUpdatedProject);

      const result = await repository.updateProject(projectId, updateData);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: updateData,
        include: {
          user: true,
        },
      });
      expect(result).toEqual(mockUpdatedProject);
    });
  });

  describe("deleteProject", () => {
    it("should delete project by id", async () => {
      const projectId = "project-123";

      const mockDeletedProject = {
        id: "project-123",
        userId: "user-123",
        name: "Deleted Project",
        description: "Description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      };

      prisma.project.delete.mockResolvedValue(mockDeletedProject);

      const result = await repository.deleteProject(projectId);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: projectId },
      });
      expect(result).toEqual(mockDeletedProject);
    });
  });

  describe("checkProjectOwnership", () => {
    it("should return true if user owns the project", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const mockProject = {
        userId: "user-123",
      };

      prisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await repository.checkProjectOwnership(projectId, userId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        select: { userId: true },
      });
      expect(result).toBe(true);
    });

    it("should return false if user does not own the project", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const mockProject = {
        userId: "other-user-456",
      };

      prisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await repository.checkProjectOwnership(projectId, userId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        select: { userId: true },
      });
      expect(result).toBe(false);
    });

    it("should return falsy value if project not found", async () => {
      const projectId = "non-existent";
      const userId = "user-123";

      prisma.project.findUnique.mockResolvedValue(null);

      const result = await repository.checkProjectOwnership(projectId, userId);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        select: { userId: true },
      });
      // Implementasi mengembalikan null (falsy) karena: null && userId === null
      expect(result).toBeFalsy();
    });
  });
});
