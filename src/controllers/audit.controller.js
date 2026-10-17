import auditService from '../services/audit.service.js';
import { sendSuccess } from '../utils/response.util.js';

export async function createAudit(req, res, next) {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const jobType = req.body?.jobType || 'FULL_AUDIT';

    const audit = await auditService.createAudit(projectId, userId, userRole, { jobType });
    return sendSuccess(res, audit, 'Audit initiated and queued successfully', 202);
  } catch (error) {
    next(error);
  }
}

export async function listProjectAudits(req, res, next) {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

    const { audits, meta } = await auditService.listProjectAudits(projectId, userId, userRole, req.query);
    return sendSuccess(res, audits, 'Project audits retrieved', 200, meta);
  } catch (error) {
    next(error);
  }
}

export async function getAuditById(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const audit = await auditService.getAuditById(req.params.id, userId, userRole);
    return sendSuccess(res, audit, 'Audit details retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getAuditProgress(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const progress = await auditService.getAuditProgress(req.params.id, userId, userRole);
    return sendSuccess(res, progress, 'Audit progress retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getAuditResults(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const results = await auditService.getAuditResults(req.params.id, userId, userRole);
    return sendSuccess(res, results, 'Audit results retrieved');
  } catch (error) {
    next(error);
  }
}

export async function retryAudit(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const result = await auditService.retryAudit(req.params.id, userId, userRole);
    return sendSuccess(res, result, 'Audit re-queued successfully', 202);
  } catch (error) {
    next(error);
  }
}

export async function cancelAudit(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const result = await auditService.cancelAudit(req.params.id, userId, userRole);
    return sendSuccess(res, result, 'Audit cancelled successfully');
  } catch (error) {
    next(error);
  }
}

export default {
  createAudit,
  listProjectAudits,
  getAuditById,
  getAuditProgress,
  getAuditResults,
  retryAudit,
  cancelAudit,
};
