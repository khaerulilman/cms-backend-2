import { v4 as uuidv4 } from 'uuid';

import { NotFoundError, ValidationError } from '../../utils/errors.js';
import ImageCleanupService from '../../utils/imageCleanupService.js';
import logger from '../../utils/logger.js';
import { Validator } from '../../utils/validator.js';

import ProjectRepository from './project.repository.js';

export class ProjectService {
  constructor() {
    this.repository = new ProjectRepository();
  }

  validateUUID(id, fieldName = 'ID') {
    if (!id || !Validator.isValidUUID(id)) {
      throw new NotFoundError(`${fieldName} not found`);
    }
  }

  async createProject(userId, data) {
    logger.debug(
      { userId, projectName: data.name },
      'Create project service called',
    );
    // Validate input
    if (!data.name || data.name.trim() === '') {
      logger.warn({ userId }, 'Project name is required');
      throw new ValidationError('Project name is required');
    }

    const project = await this.repository.createProject({
      id: uuidv4(),
      userId,
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
    });

    logger.info({ projectId: project.id, userId }, 'Project created');

    return {
      id: project.id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  async getProjectById(projectId, userId) {
    logger.debug({ projectId, userId }, 'Get project by ID service called');
    // Validate UUID format
    this.validateUUID(projectId, 'Project');

    const project = await this.repository.findProjectById(projectId);

    if (!project) {
      logger.warn({ projectId }, 'Project not found in database');
      throw new NotFoundError('Project not found');
    }

    // Check ownership
    if (project.userId !== userId) {
      logger.warn(
        { projectId, userId, ownerId: project.userId },
        'Project ownership check failed',
      );
      throw new NotFoundError('Project not found');
    }

    logger.info({ projectId, userId }, 'Project retrieved by ID');
    return {
      id: project.id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      cmsTables: project.cmsTables || [],
    };
  }

  async getUserProjects(userId) {
    logger.debug({ userId }, 'Get user projects service called');
    const projects = await this.repository.findProjectsByUserId(userId);

    logger.info(
      { userId, projectCount: projects.length },
      'User projects retrieved',
    );
    return projects.map((project) => ({
      id: project.id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  }

  async updateProject(projectId, userId, data) {
    logger.debug(
      { projectId, userId, newName: data.name },
      'Update project service called',
    );
    // Validate UUID format
    this.validateUUID(projectId, 'Project');

    // Validate input before checking ownership
    if (data.name !== undefined && (!data.name || data.name.trim() === '')) {
      logger.warn({ projectId, userId }, 'Project name is empty for update');
      throw new ValidationError('Project name cannot be empty');
    }

    if (
      data.description !== undefined &&
      data.description &&
      data.description.length > 500
    ) {
      logger.warn(
        { projectId, userId, descriptionLength: data.description.length },
        'Project description exceeds limit',
      );
      throw new ValidationError(
        'Project description must not exceed 500 characters',
      );
    }

    // Check ownership
    const isOwner = await this.repository.checkProjectOwnership(
      projectId,
      userId,
    );
    if (!isOwner) {
      logger.warn({ projectId, userId }, 'Project ownership check failed');
      throw new NotFoundError('Project not found');
    }

    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined)
      updateData.description = data.description
        ? data.description.trim()
        : null;

    const project = await this.repository.updateProject(projectId, updateData);

    logger.info(
      { projectId, userId, newName: project.name },
      'Project updated',
    );
    return {
      id: project.id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  async deleteProject(projectId, userId) {
    logger.debug({ projectId, userId }, 'Delete project service called');
    // Validate UUID format
    this.validateUUID(projectId, 'Project');

    // Check ownership
    const isOwner = await this.repository.checkProjectOwnership(
      projectId,
      userId,
    );
    if (!isOwner) {
      logger.warn({ projectId, userId }, 'Project ownership check failed');
      throw new NotFoundError('Project not found');
    }

    // Cleanup all images in this project
    logger.debug({ projectId }, 'Cleaning up images from project');
    await ImageCleanupService.deleteImagesByProjectId(projectId);

    await this.repository.deleteProject(projectId);

    logger.info({ projectId, userId }, 'Project deleted');

    return { message: 'Project deleted successfully' };
  }
}

export default ProjectService;
