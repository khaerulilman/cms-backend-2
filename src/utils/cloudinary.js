import cloudinary from "../config/cloudinary.js";

import logger from "./logger.js";

export class CloudinaryService {
  // Upload image to Cloudinary
  static async uploadImage(filePath, options = {}) {
    try {
      logger.debug({ filePath }, "Uploading image to Cloudinary");
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "cms-uploads",
        resource_type: "auto",
        ...options,
      });

      logger.info(
        { publicId: result.public_id },
        "Image uploaded to Cloudinary",
      );
      return {
        imageUrl: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      logger.error({ err: error, filePath }, "Cloudinary upload failed");
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  // Delete image from Cloudinary
  static async deleteImage(publicId) {
    try {
      logger.debug({ publicId }, "Deleting image from Cloudinary");
      const result = await cloudinary.uploader.destroy(publicId);
      logger.info({ publicId }, "Image deleted from Cloudinary");
      return result;
    } catch (error) {
      logger.error({ err: error, publicId }, "Cloudinary deletion failed");
      throw new Error(`Cloudinary deletion failed: ${error.message}`);
    }
  }

  // Duplicate image by re-uploading from existing URL
  static async duplicateImage(imageUrl) {
    try {
      logger.debug({ imageUrl }, "Duplicating image in Cloudinary");
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: "cms-uploads",
        resource_type: "auto",
      });

      logger.info(
        { originalUrl: imageUrl, newPublicId: result.public_id },
        "Image duplicated in Cloudinary",
      );
      return {
        imageUrl: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      logger.error(
        { err: error, imageUrl },
        "Cloudinary image duplication failed",
      );
      throw new Error(`Cloudinary image duplication failed: ${error.message}`);
    }
  }

  // Delete multiple images
  static async deleteImages(publicIds) {
    try {
      logger.debug(
        { count: publicIds.length },
        "Batch deleting images from Cloudinary",
      );
      const results = await Promise.all(
        publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)),
      );
      logger.info(
        { count: publicIds.length },
        "Batch image deletion completed",
      );
      return results;
    } catch (error) {
      logger.error(
        { err: error, count: publicIds.length },
        "Cloudinary batch deletion failed",
      );
      throw new Error(`Cloudinary batch deletion failed: ${error.message}`);
    }
  }
}

export default CloudinaryService;
