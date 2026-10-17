import projectRepository from '../repositories/project.repository.js';
import auditRepository from '../repositories/audit.repository.js';
import { validateUrlForSsrf } from '../utils/ssrf.util.js';
import { ApiError } from '../utils/apiError.util.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.util.js';

export class ProjectService {
  async createProject(ownerId, data) {
    const { name, websiteUrl, websiteType, targetAudience, targetLocation, keywords, competitors } = data;

    // SSRF validation and domain extraction
    const { normalizedUrl, domain } = await validateUrlForSsrf(websiteUrl);

    const project = await projectRepository.create({
      ownerId,
      name: name.trim(),
      websiteUrl: normalizedUrl,
      domain,
      websiteType: websiteType || 'SaaS',
      targetAudience: targetAudience ? targetAudience.trim() : '',
      targetLocation: targetLocation ? targetLocation.trim() : 'Global',
      keywords: Array.isArray(keywords) ? keywords.map((k) => String(k).trim()).filter(Boolean) : [],
      competitors: Array.isArray(competitors) ? competitors.map((c) => String(c).trim()).filter(Boolean) : [],
      isActive: true,
    });

    return project.toJSON();
  }

  async listUserProjects(userId, userRole, query) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search || '';

    let projects;
    let total;

    if (userRole === 'ADMIN' && query.all === 'true') {
      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { domain: { $regex: search, $options: 'i' } },
        ];
      }
      projects = await projectRepository.findAll({ filter, skip, limit });
      total = await projectRepository.count(filter);
    } else {
      projects = await projectRepository.findByOwner(userId, { skip, limit, search });
      const filter = { ownerId: userId };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { domain: { $regex: search, $options: 'i' } },
        ];
      }
      total = await projectRepository.count(filter);
    }

    const meta = buildPaginationMeta(total, page, limit);

    return {
      projects: projects.map((p) => p.toJSON()),
      meta,
    };
  }

  async getProjectById(projectId, userId, userRole) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    const ownerIdStr = project.ownerId?.toString();
    const userIdStr = userId?.toString();

    if (userRole !== 'ADMIN' && ownerIdStr !== userIdStr) {
      throw ApiError.forbidden('You do not have permission to view this project.');
    }

    return project.toJSON();
  }

  async updateProject(projectId, userId, userRole, updateData) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    const ownerIdStr = project.ownerId?.toString();
    const userIdStr = userId?.toString();

    if (userRole !== 'ADMIN' && ownerIdStr !== userIdStr) {
      throw ApiError.forbidden('You do not have permission to edit this project.');
    }

    const updateFields = {};

    if (updateData.name !== undefined) {
      updateFields.name = updateData.name.trim();
    }

    if (updateData.websiteUrl !== undefined) {
      const { normalizedUrl, domain } = await validateUrlForSsrf(updateData.websiteUrl);
      updateFields.websiteUrl = normalizedUrl;
      updateFields.domain = domain;
    }

    if (updateData.websiteType !== undefined) {
      updateFields.websiteType = updateData.websiteType;
    }

    if (updateData.targetAudience !== undefined) {
      updateFields.targetAudience = updateData.targetAudience.trim();
    }

    if (updateData.targetLocation !== undefined) {
      updateFields.targetLocation = updateData.targetLocation.trim();
    }

    if (updateData.keywords !== undefined && Array.isArray(updateData.keywords)) {
      updateFields.keywords = updateData.keywords.map((k) => String(k).trim()).filter(Boolean);
    }

    if (updateData.competitors !== undefined && Array.isArray(updateData.competitors)) {
      updateFields.competitors = updateData.competitors.map((c) => String(c).trim()).filter(Boolean);
    }

    if (updateData.isActive !== undefined && typeof updateData.isActive === 'boolean') {
      updateFields.isActive = updateData.isActive;
    }

    const updated = await projectRepository.updateById(projectId, updateFields);
    return updated.toJSON();
  }

  async deleteProject(projectId, userId, userRole) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    const ownerIdStr = project.ownerId?.toString();
    const userIdStr = userId?.toString();

    if (userRole !== 'ADMIN' && ownerIdStr !== userIdStr) {
      throw ApiError.forbidden('You do not have permission to delete this project.');
    }

    // Cascade delete associated audits
    await auditRepository.deleteByProjectId(projectId);
    await projectRepository.deleteById(projectId);

    return { success: true, message: 'Project and associated audits deleted successfully.' };
  }
}

export const projectService = new ProjectService();
export default projectService;
