import projectService from '../services/project.service.js';
import { sendSuccess } from '../utils/response.util.js';

export async function createProject(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const project = await projectService.createProject(userId, req.body);
    return sendSuccess(res, project, 'Project created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function listProjects(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const { projects, meta } = await projectService.listUserProjects(userId, userRole, req.query);
    return sendSuccess(res, projects, 'Projects retrieved', 200, meta);
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const project = await projectService.getProjectById(req.params.id, userId, userRole);
    return sendSuccess(res, project, 'Project details retrieved');
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const updated = await projectService.updateProject(req.params.id, userId, userRole, req.body);
    return sendSuccess(res, updated, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const result = await projectService.deleteProject(req.params.id, userId, userRole);
    return sendSuccess(res, result, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
}

export default {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
