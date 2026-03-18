import { describe, it, expect, beforeEach, vi } from "vitest";

import { SUCCESS_MESSAGES } from "../../../constants/http.js";
import { ProjectController } from "../project.controller.js";

// Mock ProjectService
vi.mock("../project.service.js", () => ({
  default: class MockProjectService {
    createProject = vi.fn();
    getProjectById = vi.fn();
    getUserProjects = vi.fn();
    updateProject = vi.fn();
    deleteProject = vi.fn();
  },
}));

describe("ProjectController", () => {
  let controller;
  let mockService;
  let req;
  let res;
  let next;

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      createProject: vi.fn(),
      getProjectById: vi.fn(),
      getUserProjects: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
    };

    controller = new ProjectController();
    controller.service = mockService;

    // Mock request
    req = {
      user: { id: "user-123" },
      params: {},
      body: {},
    };

    // Mock response
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Mock next
    next = vi.fn();
  });

  describe("createProject", () => {
    it("should create project and return 201 status", async () => {
      req.body = {
        name: "Test Project",
        description: "Test description",
      };

      // Mock service return berbeda dari response (tidak ada success/message)
      const mockServiceResult = {
        id: "project-123",
        userId: "user-123",
        name: "Test Project",
        description: "Test description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      };

      const expectedResponse = {
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_CREATED,
        data: mockServiceResult,
      };

      mockService.createProject.mockResolvedValue(mockServiceResult);

      await controller.createProject(req, res, next);

      expect(mockService.createProject).toHaveBeenCalledWith("user-123", {
        name: "Test Project",
        description: "Test description",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      req.body = {
        name: "Test Project",
      };

      const mockError = new Error("Service error");
      mockService.createProject.mockRejectedValue(mockError);

      await controller.createProject(req, res, next);

      expect(mockService.createProject).toHaveBeenCalledWith("user-123", {
        name: "Test Project",
        description: undefined,
      });
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("getProject", () => {
    it("should get project by id and return 200 status", async () => {
      req.params = { projectId: "project-123" };

      const mockServiceResult = {
        id: "project-123",
        userId: "user-123",
        name: "Test Project",
        description: "Test description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
        cmsTables: [],
      };

      const expectedResponse = {
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_RETRIEVED,
        data: mockServiceResult,
      };

      mockService.getProjectById.mockResolvedValue(mockServiceResult);

      await controller.getProject(req, res, next);

      expect(mockService.getProjectById).toHaveBeenCalledWith(
        "project-123",
        "user-123",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      req.params = { projectId: "project-123" };

      const mockError = new Error("Not found");
      mockService.getProjectById.mockRejectedValue(mockError);

      await controller.getProject(req, res, next);

      expect(mockService.getProjectById).toHaveBeenCalledWith(
        "project-123",
        "user-123",
      );
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getUserProjects", () => {
    it("should get all user projects and return 200 status", async () => {
      const mockServiceResult = [
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

      const expectedResponse = {
        success: true,
        message: SUCCESS_MESSAGES.PROJECTS_RETRIEVED,
        data: mockServiceResult,
      };

      mockService.getUserProjects.mockResolvedValue(mockServiceResult);

      await controller.getUserProjects(req, res, next);

      expect(mockService.getUserProjects).toHaveBeenCalledWith("user-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return empty array if user has no projects", async () => {
      mockService.getUserProjects.mockResolvedValue([]);

      await controller.getUserProjects(req, res, next);

      expect(mockService.getUserProjects).toHaveBeenCalledWith("user-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: SUCCESS_MESSAGES.PROJECTS_RETRIEVED,
        data: [],
      });
    });

    it("should call next with error if service throws", async () => {
      const mockError = new Error("Service error");
      mockService.getUserProjects.mockRejectedValue(mockError);

      await controller.getUserProjects(req, res, next);

      expect(mockService.getUserProjects).toHaveBeenCalledWith("user-123");
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("updateProject", () => {
    it("should update project and return 200 status", async () => {
      req.params = { projectId: "project-123" };
      req.body = {
        name: "Updated Name",
        description: "Updated description",
      };

      const mockServiceResult = {
        id: "project-123",
        userId: "user-123",
        name: "Updated Name",
        description: "Updated description",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-20"),
      };

      const expectedResponse = {
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_UPDATED,
        data: mockServiceResult,
      };

      mockService.updateProject.mockResolvedValue(mockServiceResult);

      await controller.updateProject(req, res, next);

      expect(mockService.updateProject).toHaveBeenCalledWith(
        "project-123",
        "user-123",
        {
          name: "Updated Name",
          description: "Updated description",
        },
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      req.params = { projectId: "project-123" };
      req.body = { name: "Updated Name" };

      const mockError = new Error("Validation error");
      mockService.updateProject.mockRejectedValue(mockError);

      await controller.updateProject(req, res, next);

      expect(mockService.updateProject).toHaveBeenCalledWith(
        "project-123",
        "user-123",
        {
          name: "Updated Name",
          description: undefined,
        },
      );
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("deleteProject", () => {
    it("should delete project and return 200 status", async () => {
      req.params = { projectId: "project-123" };

      const mockServiceResult = {
        message: "Project deleted successfully",
      };

      const expectedResponse = {
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_DELETED,
      };

      mockService.deleteProject.mockResolvedValue(mockServiceResult);

      await controller.deleteProject(req, res, next);

      expect(mockService.deleteProject).toHaveBeenCalledWith(
        "project-123",
        "user-123",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      req.params = { projectId: "project-123" };

      const mockError = new Error("Not found");
      mockService.deleteProject.mockRejectedValue(mockError);

      await controller.deleteProject(req, res, next);

      expect(mockService.deleteProject).toHaveBeenCalledWith(
        "project-123",
        "user-123",
      );
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
