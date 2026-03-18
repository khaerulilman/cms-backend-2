import prisma from '../../prisma/client.js';
import logger from '../../utils/logger.js';

export class ProjectRepository {
  async createProject(data) {
    logger.debug(
      { projectName: data.name, userId: data.userId },
      'Creating project in database',
    );
    return prisma.project.create({
      data,
      include: {
        user: true,
      },
    });
  }

  async findProjectById(id) {
    logger.debug({ projectId: id }, 'Finding project by ID in database');
    return prisma.project.findUnique({
      where: { id },
      include: {
        user: true,
        cmsTables: true,
      },
    });
  }

  async findProjectsByUserId(userId) {
    logger.debug({ userId }, 'Finding projects by user ID in database');
    return prisma.project.findMany({
      where: { userId },
      include: {
        user: true,
        cmsTables: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProject(id, data) {
    logger.debug(
      { projectId: id, updatingData: data },
      'Updating project in database',
    );
    return prisma.project.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  async deleteProject(id) {
    logger.debug({ projectId: id }, 'Deleting project from database');
    return prisma.project.delete({
      where: { id },
    });
  }

  async checkProjectOwnership(projectId, userId) {
    logger.debug({ projectId, userId }, 'Checking project ownership');
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });
    if (!project) {
      logger.warn({ projectId }, 'Project not found for ownership check');
      return false;
    }
    return project.userId === userId;
  }
}

export default ProjectRepository;
