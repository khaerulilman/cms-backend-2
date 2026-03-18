import { SUCCESS_MESSAGES } from '../../constants/http.js';
import logger from '../../utils/logger.js';

import ProjectService from './project.service.js';

export class ProjectController {
  constructor() {
    this.service = new ProjectService();
  }

  async createProject(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, description } = req.body;

      logger.debug(
        { userId, projectName: name },
        'Create project request received',
      );
      const project = await this.service.createProject(userId, {
        name,
        description,
      });

      logger.info(
        { projectId: project.id, userId, projectName: project.name },
        'Project created successfully',
      );
      return res.status(201).json({
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_CREATED,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProject(req, res, next) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      logger.debug({ projectId, userId }, 'Get project request received');
      const project = await this.service.getProjectById(projectId, userId);

      logger.info(
        { projectId, userId, projectName: project.name },
        'Project retrieved successfully',
      );
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_RETRIEVED,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserProjects(req, res, next) {
    try {
      const userId = req.user.id;

      logger.debug({ userId }, 'Get user projects request received');
      const projects = await this.service.getUserProjects(userId);

      logger.info(
        { userId, projectCount: projects.length },
        'User projects retrieved successfully',
      );
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.PROJECTS_RETRIEVED,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { name, description } = req.body;

      logger.debug(
        { projectId, userId, newName: name },
        'Update project request received',
      );
      const project = await this.service.updateProject(projectId, userId, {
        name,
        description,
      });

      logger.info(
        { projectId, userId, newName: project.name },
        'Project updated successfully',
      );
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_UPDATED,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      logger.debug({ projectId, userId }, 'Delete project request received');
      await this.service.deleteProject(projectId, userId);

      logger.info({ projectId, userId }, 'Project deleted successfully');
      return res.status(200).json({
        success: true,
        message: SUCCESS_MESSAGES.PROJECT_DELETED,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ProjectController;
