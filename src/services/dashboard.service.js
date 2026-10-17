import projectRepository from '../repositories/project.repository.js';
import auditRepository from '../repositories/audit.repository.js';

export class DashboardService {
  async getUserDashboardSummary(userId) {
    const [
      totalProjects,
      activeProjects,
      totalAudits,
      statusCounts,
      averageScores,
      recentProjects,
      recentAudits,
    ] = await Promise.all([
      projectRepository.count({ ownerId: userId }),
      projectRepository.count({ ownerId: userId, isActive: true }),
      auditRepository.count({ ownerId: userId }),
      auditRepository.getStatusCounts(userId),
      auditRepository.getAverageScores(userId),
      projectRepository.findByOwner(userId, { limit: 5 }),
      auditRepository.findByOwnerId(userId, { limit: 5 }),
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
      stats: {
        totalProjects,
        activeProjects,
        totalAudits,
        runningAudits,
        completedAudits: statusCounts['COMPLETED'] || 0,
        failedAudits: statusCounts['FAILED'] || 0,
        averageSeoScore: averageScores.avgSeoScore,
        averageAeoScore: averageScores.avgAeoScore,
      },
      recentProjects: recentProjects.map((p) => p.toJSON()),
      recentAudits: recentAudits.map((a) => a.toJSON()),
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
