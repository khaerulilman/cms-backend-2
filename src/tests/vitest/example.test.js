import { describe, it, expect, beforeEach } from "vitest";

import {
  getPrismaTestClient,
  cleanDatabase,
  createTestUser,
  createTestProject,
} from "./helpers/database.js";

describe("Example Test Suite", () => {
  // Clean database before each test
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("User Tests", () => {
    it("should create a user", async () => {
      const prisma = getPrismaTestClient();

      const user = await prisma.user.create({
        data: {
          email: "testuser@example.com",
          password: "hashedpassword",
          name: "Test User",
        },
      });

      expect(user).toBeDefined();
      expect(user.email).toBe("testuser@example.com");
      expect(user.name).toBe("Test User");
    });

    it("should retrieve user by id", async () => {
      const prisma = getPrismaTestClient();

      // Create test user
      const createdUser = await createTestUser({
        email: "finduser@example.com",
        name: "Find Me",
      });

      // Find user
      const foundUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe("finduser@example.com");
    });
  });

  describe("Project Tests", () => {
    it("should create a project for user", async () => {
      const _prisma = getPrismaTestClient();

      // Create test user first
      const user = await createTestUser({
        email: "projectowner@example.com",
      });

      // Create project
      const project = await createTestProject(user.id, {
        name: "My Test Project",
        description: "A test project",
      });

      expect(project).toBeDefined();
      expect(project.name).toBe("My Test Project");
      expect(project.userId).toBe(user.id);
    });

    it("should retrieve projects for user", async () => {
      const prisma = getPrismaTestClient();

      // Create test user
      const user = await createTestUser();

      // Create multiple projects
      await createTestProject(user.id, { name: "Project 1" });
      await createTestProject(user.id, { name: "Project 2" });

      // Get all projects for user
      const projects = await prisma.project.findMany({
        where: { userId: user.id },
      });

      expect(projects).toHaveLength(2);
      expect(projects[0].name).toBe("Project 1");
      expect(projects[1].name).toBe("Project 2");
    });
  });
});
