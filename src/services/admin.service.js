import userRepository from '../repositories/user.repository.js';
import projectRepository from '../repositories/project.repository.js';
import auditRepository from '../repositories/audit.repository.js';
import { checkQueueStats } from '../config/rabbitmq.js';
import { ApiError } from '../utils/apiError.util.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.util.js';

export class AdminService {
  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalAudits,
      statusCounts,
      averageScores,
      queueStats,
    ] = await Promise.all([
      userRepository.count(),
      userRepository.count({ isActive: true }),
      projectRepository.count(),
      projectRepository.count({ isActive: true }),
      auditRepository.count(),
      auditRepository.getStatusCounts(),
      auditRepository.getAverageScores(),
      checkQueueStats(),
    ]);

    const runningAudits =
      (statusCounts['CRAWLING'] || 0) +
      (statusCounts['SEO_ANALYSIS'] || 0) +
      (statusCounts['AEO_ANALYSIS'] || 0) +
      (statusCounts['RESEARCHING'] || 0) +
      (statusCounts['INDEXING'] || 0) +
      (statusCounts['GENERATING'] || 0) +
      (statusCounts['VALIDATING'] || 0);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
      },
      audits: {
        total: totalAudits,
        queued: statusCounts['QUEUED'] || 0,
        running: runningAudits,
        completed: statusCounts['COMPLETED'] || 0,
        failed: statusCounts['FAILED'] || 0,
        cancelled: statusCounts['CANCELLED'] || 0,
        statusBreakdown: statusCounts,
      },
      scores: {
        averageSeoScore: averageScores.avgSeoScore,
        averageAeoScore: averageScores.avgAeoScore,
      },
      queue: queueStats,
    };
  }

  async listUsers(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const filter = {};

    if (query.role) {
      filter.role = query.role.toUpperCase();
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const users = await userRepository.findAll({ filter, skip, limit });
    const total = await userRepository.count(filter);
    const meta = buildPaginationMeta(total, page, limit);

    return {
      users: users.map((u) => u.toJSON()),
      meta,
    };
  }

  async getUserDetails(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const [projectCount, auditCount, recentProjects] = await Promise.all([
      projectRepository.count({ ownerId: userId }),
      auditRepository.count({ ownerId: userId }),
      projectRepository.findByOwner(userId, { limit: 5 }),
    ]);

    const userObj = user.toJSON();
    userObj.projectCount = projectCount;
    userObj.auditCount = auditCount;
    userObj.recentProjects = recentProjects.map((p) => p.toJSON());

    return userObj;
  }

  async toggleUserStatus(targetUserId, isActive, adminUserId) {
    if (String(targetUserId) === String(adminUserId) && !isActive) {
      throw ApiError.badRequest('Administrators cannot deactivate their own accounts.');
    }

    const user = await userRepository.findById(targetUserId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const updatedUser = await userRepository.updateById(targetUserId, { isActive });
    return updatedUser.toJSON();
  }

  async listAllProjects(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const filter = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { domain: { $regex: query.search, $options: 'i' } },
      ];
    }

    const projects = await projectRepository.findAll({ filter, skip, limit });
    const total = await projectRepository.count(filter);
    const meta = buildPaginationMeta(total, page, limit);

    return {
      projects: projects.map((p) => p.toJSON()),
      meta,
    };
  }

  async listAllAudits(query) {
    const { page, limit, skip } = getPaginationParams(query);
    const filter = {};

    if (query.status) {
      filter.status = query.status.toUpperCase();
    }
    if (query.projectId) {
      filter.projectId = query.projectId;
    }

    const audits = await auditRepository.findAll({ filter, skip, limit });
    const total = await auditRepository.count(filter);
    const meta = buildPaginationMeta(total, page, limit);

    return {
      audits: audits.map((a) => a.toJSON()),
      meta,
    };
  }

  async getAuditFailureDetails(auditId) {
    const audit = await auditRepository.findById(auditId);
    if (!audit) {
      throw ApiError.notFound('Audit not found.');
    }

    return {
      auditId: audit.id,
      jobId: audit.jobId,
      status: audit.status,
      currentStage: audit.currentStage,
      startedAt: audit.startedAt,
      completedAt: audit.completedAt,
      error: audit.error || null,
      project: audit.projectId,
      owner: audit.ownerId,
    };
  }

  async getQueueInspection() {
    return await checkQueueStats();
  }
}

export const adminService = new AdminService();
export default adminService;
