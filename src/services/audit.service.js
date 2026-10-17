import crypto from 'crypto';
import auditRepository from '../repositories/audit.repository.js';
import projectRepository from '../repositories/project.repository.js';
import { publishAuditJob } from '../queues/audit.publisher.js';
import { ApiError } from '../utils/apiError.util.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.util.js';

export class AuditService {
  /**
   * Initiates a new audit for a project.
   * Creates audit record, publishes message to RabbitMQ, and handles failure cleanly.
   */
  async createAudit(projectId, userId, userRole, { jobType = 'FULL_AUDIT' } = {}) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    const ownerIdStr = project.ownerId?.toString();
    const userIdStr = userId?.toString();

    if (userRole !== 'ADMIN' && ownerIdStr !== userIdStr) {
      throw ApiError.forbidden('You do not have permission to trigger an audit on this project.');
    }

    if (!project.isActive) {
      throw ApiError.badRequest('Cannot audit an inactive project.');
    }

    // Generate unique, retry-safe jobId
    const jobId = `job_${crypto.randomUUID()}`;

    // 1. Create audit in initial QUEUED state
    const audit = await auditRepository.create({
      projectId,
      ownerId: project.ownerId,
      status: 'QUEUED',
      currentStage: 'QUEUED',
      progress: 0,
      jobId,
      startedAt: new Date(),
    });

    // 2. Publish to RabbitMQ message broker
    try {
      await publishAuditJob({
        jobId,
        auditId: audit.id,
        projectId: project.id,
        ownerId: project.ownerId,
        jobType,
        payload: {
          websiteUrl: project.websiteUrl,
          domain: project.domain,
          websiteType: project.websiteType,
          targetAudience: project.targetAudience,
          targetLocation: project.targetLocation,
          keywords: project.keywords,
          competitors: project.competitors,
        },
      });
    } catch (publishErr) {
      // Safely handle broker failure: mark audit as FAILED so it is not stuck silently
      await auditRepository.updateById(audit.id, {
        status: 'FAILED',
        currentStage: 'FAILED',
        completedAt: new Date(),
        error: {
          message: 'Failed to enqueue audit job to RabbitMQ message broker.',
          code: 'QUEUE_PUBLISH_FAILED',
          stage: 'QUEUED',
          details: { originalError: publishErr.message },
        },
      });

      throw ApiError.serviceUnavailable(
        `Failed to schedule audit job: ${publishErr.message}. The message broker may be temporarily unavailable.`
      );
    }

    return {
      auditId: audit.id,
      jobId: audit.jobId,
      projectId: audit.projectId,
      status: audit.status,
      currentStage: audit.currentStage,
      progress: audit.progress,
      startedAt: audit.startedAt,
    };
  }

  async listProjectAudits(projectId, userId, userRole, query) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found.');
    }

    const ownerIdStr = project.ownerId?.toString();
    const userIdStr = userId?.toString();

    if (userRole !== 'ADMIN' && ownerIdStr !== userIdStr) {
      throw ApiError.forbidden('You do not have permission to view audits for this project.');
    }

    const { page, limit, skip } = getPaginationParams(query);
    const audits = await auditRepository.findByProjectId(projectId, { skip, limit });
    const total = await auditRepository.count({ projectId });
    const meta = buildPaginationMeta(total, page, limit);

    return {
      audits: audits.map((a) => a.toJSON()),
      meta,
    };
  }

  async getAuditById(auditId, userId, userRole) {
    const audit = await auditRepository.findById(auditId);
    if (!audit) {
      throw ApiError.notFound('Audit not found.');
    }

    const auditOwnerId = audit.ownerId?.id || audit.ownerId?._id || audit.ownerId;
    if (userRole !== 'ADMIN' && String(auditOwnerId) !== String(userId)) {
      throw ApiError.forbidden('You do not have permission to view this audit.');
    }

    return audit.toJSON();
  }

  async getAuditProgress(auditId, userId, userRole) {
    const audit = await auditRepository.findById(auditId);
    if (!audit) {
      throw ApiError.notFound('Audit not found.');
    }

    const auditOwnerId = audit.ownerId?.id || audit.ownerId?._id || audit.ownerId;
    if (userRole !== 'ADMIN' && String(auditOwnerId) !== String(userId)) {
      throw ApiError.forbidden('You do not have permission to view this audit.');
    }

    return {
      id: audit.id,
      jobId: audit.jobId,
      status: audit.status,
      currentStage: audit.currentStage,
      progress: audit.progress,
      startedAt: audit.startedAt,
      completedAt: audit.completedAt,
      error: audit.error?.message ? audit.error : null,
      seoScore: audit.seoScore,
      aeoScore: audit.aeoScore,
    };
  }

  async getAuditResults(auditId, userId, userRole) {
    const audit = await auditRepository.findById(auditId);
    if (!audit) {
      throw ApiError.notFound('Audit not found.');
    }

    const auditOwnerId = audit.ownerId?.id || audit.ownerId?._id || audit.ownerId;
    if (userRole !== 'ADMIN' && String(auditOwnerId) !== String(userId)) {
      throw ApiError.forbidden('You do not have permission to view this audit.');
    }

    return {
      id: audit.id,
      jobId: audit.jobId,
      status: audit.status,
      seoScore: audit.seoScore,
      aeoScore: audit.aeoScore,
      summary: audit.summary,
      results: audit.results || {},
      completedAt: audit.completedAt,
    };
  }

  async retryAudit(auditId, userId, userRole) {
    const audit = await auditRepository.findById(auditId);
    if (!audit) {
      throw ApiError.notFound('Audit not found.');
    }

    const auditOwnerId = audit.ownerId?.id || audit.ownerId?._id || audit.ownerId;
    if (userRole !== 'ADMIN' && String(auditOwnerId) !== String(userId)) {
      throw ApiError.forbidden('You do not have permission to retry this audit.');
    }

    if (audit.status !== 'FAILED' && audit.status !== 'CANCELLED') {
      throw ApiError.badRequest(
        `Audit cannot be retried while in status "${audit.status}". Retry is only allowed for FAILED or CANCELLED audits.`
      );
    }

    const project = await projectRepository.findById(audit.projectId?.id || audit.projectId);
    if (!project) {
      throw ApiError.notFound('Project associated with this audit not found.');
    }

    const newJobId = `job_${crypto.randomUUID()}`;

    // Reset status to QUEUED and reset progress
    const updated = await auditRepository.updateById(audit.id, {
      status: 'QUEUED',
      currentStage: 'QUEUED',
      progress: 0,
      jobId: newJobId,
      startedAt: new Date(),
      completedAt: null,
      error: null,
    });

    try {
      await publishAuditJob({
        jobId: newJobId,
        auditId: audit.id,
        projectId: project.id,
        ownerId: project.ownerId,
        jobType: 'FULL_AUDIT',
        payload: {
          websiteUrl: project.websiteUrl,
          domain: project.domain,
          websiteType: project.websiteType,
          targetAudience: project.targetAudience,
          targetLocation: project.targetLocation,
          keywords: project.keywords,
          competitors: project.competitors,
        },
      });
    } catch (err) {
      await auditRepository.updateById(audit.id, {
        status: 'FAILED',
        currentStage: 'FAILED',
        completedAt: new Date(),
        error: {
          message: 'Failed to enqueue retry job to RabbitMQ message broker.',
          code: 'QUEUE_PUBLISH_FAILED',
          stage: 'QUEUED',
          details: { originalError: err.message },
        },
      });
      throw ApiError.serviceUnavailable(`Failed to republish audit job: ${err.message}`);
    }

    return {
      auditId: updated.id,
      jobId: newJobId,
      status: updated.status,
      message: 'Audit job re-queued successfully.',
    };
  }

  async cancelAudit(auditId, userId, userRole) {
    const audit = await auditRepository.findById(auditId);
    if (!audit) {
      throw ApiError.notFound('Audit not found.');
    }

    const auditOwnerId = audit.ownerId?.id || audit.ownerId?._id || audit.ownerId;
    if (userRole !== 'ADMIN' && String(auditOwnerId) !== String(userId)) {
      throw ApiError.forbidden('You do not have permission to cancel this audit.');
    }

    if (audit.status === 'COMPLETED') {
      throw ApiError.badRequest('Completed audits cannot be cancelled.');
    }

    if (audit.status === 'CANCELLED') {
      return { success: true, message: 'Audit is already cancelled.' };
    }

    const updated = await auditRepository.updateById(audit.id, {
      status: 'CANCELLED',
      currentStage: 'CANCELLED',
      completedAt: new Date(),
    });

    return {
      auditId: updated.id,
      status: updated.status,
      message: 'Audit cancelled successfully.',
    };
  }
}

export const auditService = new AuditService();
export default auditService;
