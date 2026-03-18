import { describe, it, expect, beforeEach, vi } from "vitest";

import cloudinary from "../../config/cloudinary.js";
import { CloudinaryService } from "../cloudinary.js";

// Mock logger to prevent noise in test output
vi.mock("../logger.js", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock cloudinary
vi.mock("../../config/cloudinary.js", () => ({
  default: {
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

describe("CloudinaryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadImage", () => {
    it("should upload image successfully", async () => {
      const mockResult = {
        secure_url: "https://res.cloudinary.com/test/image.jpg",
        public_id: "cms-uploads/test-image",
      };

      cloudinary.uploader.upload.mockResolvedValue(mockResult);

      const result = await CloudinaryService.uploadImage("/path/to/image.jpg");

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        "/path/to/image.jpg",
        {
          folder: "cms-uploads",
          resource_type: "auto",
        },
      );
      expect(result).toEqual({
        imageUrl: "https://res.cloudinary.com/test/image.jpg",
        publicId: "cms-uploads/test-image",
      });
    });

    it("should upload image with custom options", async () => {
      const mockResult = {
        secure_url: "https://res.cloudinary.com/test/custom.jpg",
        public_id: "custom-folder/custom-image",
      };

      cloudinary.uploader.upload.mockResolvedValue(mockResult);

      const customOptions = {
        folder: "custom-folder",
        transformation: { width: 500, height: 500 },
      };

      const result = await CloudinaryService.uploadImage(
        "/path/to/image.jpg",
        customOptions,
      );

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        "/path/to/image.jpg",
        {
          folder: "custom-folder",
          resource_type: "auto",
          transformation: { width: 500, height: 500 },
        },
      );
      expect(result.imageUrl).toBe(
        "https://res.cloudinary.com/test/custom.jpg",
      );
    });

    it("should throw error when upload fails", async () => {
      cloudinary.uploader.upload.mockRejectedValue(new Error("Upload error"));

      await expect(
        CloudinaryService.uploadImage("/path/to/image.jpg"),
      ).rejects.toThrow("Cloudinary upload failed: Upload error");
    });

    it("should throw error with specific message on network failure", async () => {
      cloudinary.uploader.upload.mockRejectedValue(new Error("Network error"));

      await expect(
        CloudinaryService.uploadImage("/invalid/path.jpg"),
      ).rejects.toThrow("Cloudinary upload failed: Network error");
    });
  });

  describe("deleteImage", () => {
    it("should delete image successfully", async () => {
      const mockResult = { result: "ok" };

      cloudinary.uploader.destroy.mockResolvedValue(mockResult);

      const result = await CloudinaryService.deleteImage(
        "cms-uploads/test-image",
      );

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "cms-uploads/test-image",
      );
      expect(result).toEqual({ result: "ok" });
    });

    it("should throw error when deletion fails", async () => {
      cloudinary.uploader.destroy.mockRejectedValue(new Error("Delete error"));

      await expect(
        CloudinaryService.deleteImage("cms-uploads/test-image"),
      ).rejects.toThrow("Cloudinary deletion failed: Delete error");
    });

    it("should handle non-existent image deletion", async () => {
      const mockResult = { result: "not found" };

      cloudinary.uploader.destroy.mockResolvedValue(mockResult);

      const result = await CloudinaryService.deleteImage("non-existent-id");

      expect(result).toEqual({ result: "not found" });
    });
  });

  describe("deleteImages", () => {
    it("should delete multiple images successfully", async () => {
      const mockResults = [
        { result: "ok" },
        { result: "ok" },
        { result: "ok" },
      ];

      cloudinary.uploader.destroy
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);

      const publicIds = ["image1", "image2", "image3"];
      const results = await CloudinaryService.deleteImages(publicIds);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(3);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("image1");
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("image2");
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("image3");
      expect(results).toEqual(mockResults);
    });

    it("should handle empty array", async () => {
      const results = await CloudinaryService.deleteImages([]);

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(results).toEqual([]);
    });

    it("should throw error when batch deletion fails", async () => {
      cloudinary.uploader.destroy.mockRejectedValue(new Error("Batch error"));

      await expect(
        CloudinaryService.deleteImages(["image1", "image2"]),
      ).rejects.toThrow("Cloudinary batch deletion failed: Batch error");
    });

    it("should delete single image in array", async () => {
      const mockResult = { result: "ok" };

      cloudinary.uploader.destroy.mockResolvedValue(mockResult);

      const results = await CloudinaryService.deleteImages(["single-image"]);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("single-image");
      expect(results).toEqual([mockResult]);
    });
  });
});
