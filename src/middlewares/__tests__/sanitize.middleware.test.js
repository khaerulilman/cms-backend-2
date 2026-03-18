import { describe, it, expect, beforeEach, vi } from "vitest";
import xss from "xss";

import { sanitizeInput } from "../sanitize.middleware.js";

// Mock xss
vi.mock("xss", () => ({
  default: vi.fn((input) => {
    // Simple mock: remove script tags for testing
    return input.replace(/<script.*?>.*?<\/script>/gi, "");
  }),
}));

describe("Sanitize Middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };

    mockRes = {};
    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  describe("sanitizeInput", () => {
    it("should sanitize string values in request body", () => {
      mockReq.body = {
        name: "John<script>alert('xss')</script>",
        email: "test@example.com",
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(xss).toHaveBeenCalledWith("John<script>alert('xss')</script>");
      expect(xss).toHaveBeenCalledWith("test@example.com");
      expect(mockReq.body.name).toBe("John");
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should sanitize string values in query params", () => {
      mockReq.query = {
        search: "test<script>alert('xss')</script>",
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(xss).toHaveBeenCalledWith("test<script>alert('xss')</script>");
      expect(mockReq.query.search).toBe("test");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should sanitize string values in route params", () => {
      mockReq.params = {
        id: "123<script>alert('xss')</script>",
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(xss).toHaveBeenCalledWith("123<script>alert('xss')</script>");
      expect(mockReq.params.id).toBe("123");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should keep non-string values unchanged in body", () => {
      mockReq.body = {
        name: "John",
        age: 25,
        isActive: true,
        score: 98.5,
        emptyValue: null,
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.age).toBe(25);
      expect(mockReq.body.isActive).toBe(true);
      expect(mockReq.body.score).toBe(98.5);
      expect(mockReq.body.emptyValue).toBeNull();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should sanitize nested objects", () => {
      mockReq.body = {
        user: {
          name: "John<script>alert('xss')</script>",
          profile: {
            bio: "Hello<script>alert('xss')</script>",
          },
        },
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(xss).toHaveBeenCalledWith("John<script>alert('xss')</script>");
      expect(xss).toHaveBeenCalledWith("Hello<script>alert('xss')</script>");
      expect(mockReq.body.user.name).toBe("John");
      expect(mockReq.body.user.profile.bio).toBe("Hello");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should sanitize array of strings", () => {
      mockReq.body = {
        tags: [
          "tag1<script>alert('xss')</script>",
          "tag2",
          "tag3<script>alert('xss')</script>",
        ],
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(xss).toHaveBeenCalledWith("tag1<script>alert('xss')</script>");
      expect(xss).toHaveBeenCalledWith("tag2");
      expect(xss).toHaveBeenCalledWith("tag3<script>alert('xss')</script>");
      expect(mockReq.body.tags).toEqual(["tag1", "tag2", "tag3"]);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should sanitize array of objects", () => {
      mockReq.body = {
        items: [
          { name: "Item1<script>alert('xss')</script>" },
          { name: "Item2" },
        ],
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(xss).toHaveBeenCalledWith("Item1<script>alert('xss')</script>");
      expect(xss).toHaveBeenCalledWith("Item2");
      expect(mockReq.body.items[0].name).toBe("Item1");
      expect(mockReq.body.items[1].name).toBe("Item2");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should keep non-string array elements unchanged", () => {
      mockReq.body = {
        numbers: [1, 2, 3],
        booleans: [true, false],
        mixed: ["text", 123, true],
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.numbers).toEqual([1, 2, 3]);
      expect(mockReq.body.booleans).toEqual([true, false]);
      expect(mockReq.body.mixed[0]).toBe("text");
      expect(mockReq.body.mixed[1]).toBe(123);
      expect(mockReq.body.mixed[2]).toBe(true);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should handle empty objects", () => {
      mockReq.body = {};
      mockReq.query = {};
      mockReq.params = {};

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual({});
      expect(mockReq.query).toEqual({});
      expect(mockReq.params).toEqual({});
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should handle undefined body, query, and params", () => {
      mockReq = {};

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should sanitize deeply nested objects", () => {
      mockReq.body = {
        level1: {
          level2: {
            level3: {
              name: "Deep<script>alert('xss')</script>",
            },
          },
        },
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(xss).toHaveBeenCalledWith("Deep<script>alert('xss')</script>");
      expect(mockReq.body.level1.level2.level3.name).toBe("Deep");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should sanitize complex nested structure with arrays and objects", () => {
      mockReq.body = {
        users: [
          {
            name: "User1<script>alert('xss')</script>",
            tags: ["tag1<script>alert('xss')</script>", "tag2"],
          },
          {
            name: "User2",
            tags: ["tag3"],
          },
        ],
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(xss).toHaveBeenCalledWith("User1<script>alert('xss')</script>");
      expect(xss).toHaveBeenCalledWith("tag1<script>alert('xss')</script>");
      expect(mockReq.body.users[0].name).toBe("User1");
      expect(mockReq.body.users[0].tags[0]).toBe("tag1");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should handle null values in nested objects", () => {
      mockReq.body = {
        user: {
          name: "John",
          middleName: null,
          profile: null,
        },
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.user.middleName).toBeNull();
      expect(mockReq.body.user.profile).toBeNull();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should sanitize all request parts simultaneously", () => {
      mockReq.body = {
        name: "Body<script>alert('xss')</script>",
      };
      mockReq.query = {
        search: "Query<script>alert('xss')</script>",
      };
      mockReq.params = {
        id: "Param<script>alert('xss')</script>",
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.name).toBe("Body");
      expect(mockReq.query.search).toBe("Query");
      expect(mockReq.params.id).toBe("Param");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should call next exactly once", () => {
      mockReq.body = { name: "Test" };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle empty arrays", () => {
      mockReq.body = {
        tags: [],
        items: [],
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.tags).toEqual([]);
      expect(mockReq.body.items).toEqual([]);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("should handle objects with prototype properties correctly", () => {
      mockReq.body = {
        name: "Test<script>alert('xss')</script>",
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(Object.prototype.hasOwnProperty.call(mockReq.body, "name")).toBe(
        true,
      );
      expect(mockReq.body.name).toBe("Test");
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
