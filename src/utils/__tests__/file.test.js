import fs from "fs/promises";

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import { FileUtils } from "../file.js";
import logger from "../logger.js";

// Mock fs/promises
vi.mock("fs/promises", () => ({
  default: {
    unlink: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));

// Mock logger
vi.mock("../logger.js", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe("FileUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("deleteFile", () => {
    it("should delete file successfully", async () => {
      fs.unlink.mockResolvedValue(undefined);

      await FileUtils.deleteFile("/path/to/file.jpg");

      expect(fs.unlink).toHaveBeenCalledWith("/path/to/file.jpg");
      expect(logger.debug).toHaveBeenCalledWith(
        { filePath: "/path/to/file.jpg" },
        "File deleted",
      );
    });

    it("should log error when deletion fails", async () => {
      const error = new Error("File not found");
      fs.unlink.mockRejectedValue(error);

      await FileUtils.deleteFile("/path/to/nonexistent.jpg");

      expect(fs.unlink).toHaveBeenCalledWith("/path/to/nonexistent.jpg");
      expect(logger.error).toHaveBeenCalledWith(
        { filePath: "/path/to/nonexistent.jpg", err: error },
        "Failed to delete file",
      );
    });

    it("should not throw error when deletion fails", async () => {
      fs.unlink.mockRejectedValue(new Error("Permission denied"));

      await expect(
        FileUtils.deleteFile("/protected/file.jpg"),
      ).resolves.toBeUndefined();
    });
  });

  describe("ensureUploadsDir", () => {
    it("should not create directory if it exists", async () => {
      fs.access.mockResolvedValue(undefined);

      await FileUtils.ensureUploadsDir();

      expect(fs.access).toHaveBeenCalled();
      expect(fs.mkdir).not.toHaveBeenCalled();
    });

    it("should create directory if it does not exist", async () => {
      fs.access.mockRejectedValue(new Error("ENOENT"));
      fs.mkdir.mockResolvedValue(undefined);

      await FileUtils.ensureUploadsDir();

      expect(fs.access).toHaveBeenCalled();
      expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
    });

    it("should create directory with recursive option", async () => {
      fs.access.mockRejectedValue(new Error("ENOENT"));
      fs.mkdir.mockResolvedValue(undefined);

      await FileUtils.ensureUploadsDir();

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ recursive: true }),
      );
    });
  });

  describe("cleanOldFiles", () => {
    it("should delete files older than maxAgeMs", async () => {
      const now = Date.now();
      const oldFileTime = now - 2 * 24 * 60 * 60 * 1000; // 2 days ago

      fs.readdir.mockResolvedValue(["old-file.jpg", "new-file.jpg"]);
      fs.stat
        .mockResolvedValueOnce({
          mtimeMs: oldFileTime,
          isFile: () => true,
        })
        .mockResolvedValueOnce({
          mtimeMs: now - 1000, // 1 second ago
          isFile: () => true,
        });
      fs.unlink.mockResolvedValue(undefined);

      await FileUtils.cleanOldFiles("/uploads");

      expect(fs.readdir).toHaveBeenCalledWith("/uploads");
      expect(fs.stat).toHaveBeenCalledTimes(2);
      expect(fs.unlink).toHaveBeenCalledTimes(1);
    });

    it("should use default maxAgeMs of 24 hours", async () => {
      const now = Date.now();
      const oldFileTime = now - 25 * 60 * 60 * 1000; // 25 hours ago

      fs.readdir.mockResolvedValue(["old-file.jpg"]);
      fs.stat.mockResolvedValue({
        mtimeMs: oldFileTime,
        isFile: () => true,
      });
      fs.unlink.mockResolvedValue(undefined);

      await FileUtils.cleanOldFiles("/uploads");

      expect(fs.unlink).toHaveBeenCalledTimes(1);
    });

    it("should not delete directories", async () => {
      const now = Date.now();
      const oldTime = now - 2 * 24 * 60 * 60 * 1000;

      fs.readdir.mockResolvedValue(["old-directory"]);
      fs.stat.mockResolvedValue({
        mtimeMs: oldTime,
        isFile: () => false, // It's a directory
      });

      await FileUtils.cleanOldFiles("/uploads");

      expect(fs.unlink).not.toHaveBeenCalled();
    });

    it("should handle empty directory", async () => {
      fs.readdir.mockResolvedValue([]);

      await FileUtils.cleanOldFiles("/uploads");

      expect(fs.stat).not.toHaveBeenCalled();
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    it("should log error when cleaning fails", async () => {
      const error = new Error("Permission denied");
      fs.readdir.mockRejectedValue(error);

      await FileUtils.cleanOldFiles("/uploads");

      expect(logger.error).toHaveBeenCalledWith(
        { dirPath: "/uploads", err: error },
        "Failed to clean old files",
      );
    });

    it("should use custom maxAgeMs", async () => {
      const now = Date.now();
      const customMaxAge = 60 * 60 * 1000; // 1 hour
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;

      fs.readdir.mockResolvedValue(["recent-file.jpg"]);
      fs.stat.mockResolvedValue({
        mtimeMs: twoHoursAgo,
        isFile: () => true,
      });
      fs.unlink.mockResolvedValue(undefined);

      await FileUtils.cleanOldFiles("/uploads", customMaxAge);

      expect(fs.unlink).toHaveBeenCalledTimes(1);
    });

    it("should not delete files newer than maxAgeMs", async () => {
      const now = Date.now();

      fs.readdir.mockResolvedValue(["new-file.jpg"]);
      fs.stat.mockResolvedValue({
        mtimeMs: now - 1000, // 1 second ago
        isFile: () => true,
      });

      await FileUtils.cleanOldFiles("/uploads");

      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });
});
