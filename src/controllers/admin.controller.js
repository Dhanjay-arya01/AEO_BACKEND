import adminService from '../services/admin.service.js';
import { sendSuccess } from '../utils/response.util.js';

export async function getDashboard(req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    return sendSuccess(res, stats, 'Admin dashboard statistics retrieved');
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    const { users, meta } = await adminService.listUsers(req.query);
    return sendSuccess(res, users, 'Users retrieved', 200, meta);
  } catch (error) {
    next(error);
  }
}

export async function getUserDetails(req, res, next) {
  try {
    const user = await adminService.getUserDetails(req.params.id);
    return sendSuccess(res, user, 'User details retrieved');
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const adminId = req.user.id || req.user._id;
    const { isActive } = req.body;
    const updated = await adminService.toggleUserStatus(req.params.id, isActive, adminId);
    return sendSuccess(
      res,
      updated,
      `User account ${isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    next(error);
  }
}

export async function listProjects(req, res, next) {
  try {
    const { projects, meta } = await adminService.listAllProjects(req.query);
    return sendSuccess(res, projects, 'Admin projects retrieved', 200, meta);
  } catch (error) {
    next(error);
  }
}

export async function listAudits(req, res, next) {
  try {
    const { audits, meta } = await adminService.listAllAudits(req.query);
    return sendSuccess(res, audits, 'Admin audits retrieved', 200, meta);
  } catch (error) {
    next(error);
  }
}

export async function getAuditFailure(req, res, next) {
  try {
    const details = await adminService.getAuditFailureDetails(req.params.id);
    return sendSuccess(res, details, 'Audit failure details retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getQueueStatus(req, res, next) {
  try {
    const queueStats = await adminService.getQueueInspection();
    return sendSuccess(res, queueStats, 'RabbitMQ queue status retrieved');
  } catch (error) {
    next(error);
  }
}

export default {
  getDashboard,
  listUsers,
  getUserDetails,
  updateUserStatus,
  listProjects,
  listAudits,
  getAuditFailure,
  getQueueStatus,
};
