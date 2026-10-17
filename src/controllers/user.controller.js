import userService from '../services/user.service.js';
import { sendSuccess } from '../utils/response.util.js';

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const profile = await userService.getProfile(userId);
    return sendSuccess(res, profile, 'Profile retrieved');
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const updated = await userService.updateProfile(userId, req.body);
    return sendSuccess(res, updated, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deactivateAccount(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const result = await userService.deactivateSelf(userId);
    return sendSuccess(res, result, 'Account deactivated successfully');
  } catch (error) {
    next(error);
  }
}

export default {
  getProfile,
  updateProfile,
  deactivateAccount,
};
