import { describe, it, expect, beforeEach, vi } from 'vitest';

import prisma from '../../prisma/client.js';
import CloudinaryService from '../cloudinary.js';
import { ImageCleanupService } from '../imageCleanupService.js';
import logger from '../logger.js';

// Mock prisma client
vi.mock('../../prisma/client.js', () => ({
  default: {
    cmsCell: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Mock CloudinaryService
vi.mock('../cloudinary.js', () => ({
  default: {
    deleteImage: vi.fn(),
    deleteImages: vi.fn(),
  },
}));

// Mock logger
vi.mock('../logger.js', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ImageCleanupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteImagesByUserId', () => {
    it('should delete all images for a user', async () => {
      const mockCells = [
        { cloudinaryPublicId: 'image1' },
        { cloudinaryPublicId: 'image2' },
        { cloudinaryPublicId: 'image3' },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockCells);
      CloudinaryService.deleteImages.mockResolvedValue([]);

      await ImageCleanupService.deleteImagesByUserId('user-123');

      expect(prisma.cmsCell.findMany).toHaveBeenCalledWith({
        where: {
          row: {
            table: {
              project: {
                userId: 'user-123',
              },
            },
          },
        },
        select: {
          cloudinaryPublicId: true,
        },
      });
      expect(CloudinaryService.deleteImages).toHaveBeenCalledWith([
        'image1',
        'image2',
        'image3',
      ]);
    });

    it('should handle user with no images', async () => {
      prisma.cmsCell.findMany.mockResolvedValue([]);

      await ImageCleanupService.deleteImagesByUserId('user-no-images');

      expect(CloudinaryService.deleteImages).not.toHaveBeenCalled();
    });

    it('should throw error when database query fails', async () => {
      prisma.cmsCell.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        ImageCleanupService.deleteImagesByUserId('user-123'),
      ).rejects.toThrow('DB error');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteImagesByProjectId', () => {
    it('should delete all images for a project', async () => {
      const mockCells = [
        { cloudinaryPublicId: 'project-image1' },
        { cloudinaryPublicId: 'project-image2' },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockCells);
      CloudinaryService.deleteImages.mockResolvedValue([]);

      await ImageCleanupService.deleteImagesByProjectId('project-123');

      expect(prisma.cmsCell.findMany).toHaveBeenCalledWith({
        where: {
          row: {
            table: {
              projectId: 'project-123',
            },
          },
        },
        select: {
          cloudinaryPublicId: true,
        },
      });
      expect(CloudinaryService.deleteImages).toHaveBeenCalledWith([
        'project-image1',
        'project-image2',
      ]);
    });

    it('should handle project with no images', async () => {
      prisma.cmsCell.findMany.mockResolvedValue([]);

      await ImageCleanupService.deleteImagesByProjectId('project-empty');

      expect(CloudinaryService.deleteImages).not.toHaveBeenCalled();
    });
  });

  describe('deleteImagesByTableId', () => {
    it('should delete all images for a table', async () => {
      const mockCells = [{ cloudinaryPublicId: 'table-image1' }];

      prisma.cmsCell.findMany.mockResolvedValue(mockCells);
      CloudinaryService.deleteImages.mockResolvedValue([]);

      await ImageCleanupService.deleteImagesByTableId('table-123');

      expect(prisma.cmsCell.findMany).toHaveBeenCalledWith({
        where: {
          row: {
            tableId: 'table-123',
          },
        },
        select: {
          cloudinaryPublicId: true,
        },
      });
      expect(CloudinaryService.deleteImages).toHaveBeenCalledWith([
        'table-image1',
      ]);
    });
  });

  describe('deleteImagesByColumnId', () => {
    it('should delete all images for a column', async () => {
      const mockCells = [
        { cloudinaryPublicId: 'col-image1' },
        { cloudinaryPublicId: 'col-image2' },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockCells);
      CloudinaryService.deleteImages.mockResolvedValue([]);

      await ImageCleanupService.deleteImagesByColumnId('column-123');

      expect(prisma.cmsCell.findMany).toHaveBeenCalledWith({
        where: {
          columnId: 'column-123',
        },
        select: {
          cloudinaryPublicId: true,
        },
      });
      expect(CloudinaryService.deleteImages).toHaveBeenCalledWith([
        'col-image1',
        'col-image2',
      ]);
    });
  });

  describe('deleteImagesByRowId', () => {
    it('should delete all images for a row', async () => {
      const mockCells = [{ cloudinaryPublicId: 'row-image1' }];

      prisma.cmsCell.findMany.mockResolvedValue(mockCells);
      CloudinaryService.deleteImages.mockResolvedValue([]);

      await ImageCleanupService.deleteImagesByRowId('row-123');

      expect(prisma.cmsCell.findMany).toHaveBeenCalledWith({
        where: {
          rowId: 'row-123',
        },
        select: {
          cloudinaryPublicId: true,
        },
      });
      expect(CloudinaryService.deleteImages).toHaveBeenCalledWith([
        'row-image1',
      ]);
    });
  });

  describe('deleteImagesByCellId', () => {
    it('should delete image for a single cell', async () => {
      const mockCell = { cloudinaryPublicId: 'cell-image' };

      prisma.cmsCell.findUnique.mockResolvedValue(mockCell);
      CloudinaryService.deleteImage.mockResolvedValue({ result: 'ok' });

      await ImageCleanupService.deleteImagesByCellId('cell-123');

      expect(prisma.cmsCell.findUnique).toHaveBeenCalledWith({
        where: { id: 'cell-123' },
        select: {
          cloudinaryPublicId: true,
        },
      });
      expect(CloudinaryService.deleteImage).toHaveBeenCalledWith('cell-image');
    });

    it('should not call delete if cell has no image', async () => {
      prisma.cmsCell.findUnique.mockResolvedValue({ cloudinaryPublicId: null });

      await ImageCleanupService.deleteImagesByCellId('cell-no-image');

      expect(CloudinaryService.deleteImage).not.toHaveBeenCalled();
    });

    it('should handle cell not found', async () => {
      prisma.cmsCell.findUnique.mockResolvedValue(null);

      await ImageCleanupService.deleteImagesByCellId('non-existent');

      expect(CloudinaryService.deleteImage).not.toHaveBeenCalled();
    });

    it('should throw error when database query fails', async () => {
      prisma.cmsCell.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(
        ImageCleanupService.deleteImagesByCellId('cell-123'),
      ).rejects.toThrow('DB error');
    });
  });

  describe('_deleteFromCloudinary', () => {
    it('should not call delete for empty cells array', async () => {
      await ImageCleanupService._deleteFromCloudinary([]);

      expect(CloudinaryService.deleteImages).not.toHaveBeenCalled();
    });

    it('should not call delete for null cells', async () => {
      await ImageCleanupService._deleteFromCloudinary(null);

      expect(CloudinaryService.deleteImages).not.toHaveBeenCalled();
    });

    it('should filter out cells without cloudinaryPublicId', async () => {
      const mockCells = [
        { cloudinaryPublicId: 'valid-image' },
        { cloudinaryPublicId: null },
        { cloudinaryPublicId: 'another-valid' },
        { cloudinaryPublicId: undefined },
      ];

      CloudinaryService.deleteImages.mockResolvedValue([]);

      await ImageCleanupService._deleteFromCloudinary(mockCells);

      expect(CloudinaryService.deleteImages).toHaveBeenCalledWith([
        'valid-image',
        'another-valid',
      ]);
    });

    it('should not throw when cloudinary delete fails (non-blocking)', async () => {
      const mockCells = [{ cloudinaryPublicId: 'image1' }];

      CloudinaryService.deleteImages.mockRejectedValue(
        new Error('Cloudinary error'),
      );

      await expect(
        ImageCleanupService._deleteFromCloudinary(mockCells),
      ).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getImagesByUserId', () => {
    it('should return all images for a user', async () => {
      const mockImages = [
        { id: '1', cloudinaryPublicId: 'img1', imageUrl: 'url1' },
        { id: '2', cloudinaryPublicId: 'img2', imageUrl: 'url2' },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockImages);

      const result = await ImageCleanupService.getImagesByUserId('user-123');

      expect(result).toEqual(mockImages);
      expect(prisma.cmsCell.findMany).toHaveBeenCalledWith({
        where: {
          row: {
            table: {
              project: {
                userId: 'user-123',
              },
            },
          },
        },
        select: {
          id: true,
          cloudinaryPublicId: true,
          imageUrl: true,
        },
      });
    });
  });

  describe('getImagesByProjectId', () => {
    it('should return all images for a project', async () => {
      const mockImages = [
        { id: '1', cloudinaryPublicId: 'img1', imageUrl: 'url1' },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockImages);

      const result =
        await ImageCleanupService.getImagesByProjectId('project-123');

      expect(result).toEqual(mockImages);
    });
  });

  describe('getImagesByTableId', () => {
    it('should return all images for a table', async () => {
      const mockImages = [
        { id: '1', cloudinaryPublicId: 'img1', imageUrl: 'url1' },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockImages);

      const result = await ImageCleanupService.getImagesByTableId('table-123');

      expect(result).toEqual(mockImages);
    });
  });

  describe('getImagesByRowId', () => {
    it('should return all images for a row', async () => {
      const mockImages = [
        { id: '1', cloudinaryPublicId: 'img1', imageUrl: 'url1' },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockImages);

      const result = await ImageCleanupService.getImagesByRowId('row-123');

      expect(result).toEqual(mockImages);
    });
  });

  describe('getImagesByColumnId', () => {
    it('should return all images for a column', async () => {
      const mockImages = [
        { id: '1', cloudinaryPublicId: 'img1', imageUrl: 'url1' },
      ];

      prisma.cmsCell.findMany.mockResolvedValue(mockImages);

      const result =
        await ImageCleanupService.getImagesByColumnId('column-123');

      expect(result).toEqual(mockImages);
    });
  });
});
