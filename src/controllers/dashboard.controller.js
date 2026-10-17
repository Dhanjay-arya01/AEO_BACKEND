import dashboardService from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.util.js';

export async function getSummary(req, res, next) {
  try {
    const userId = req.user.id || req.user._id;
    const summary = await dashboardService.getUserDashboardSummary(userId);
    return sendSuccess(res, summary, 'Dashboard summary retrieved');
  } catch (error) {
    next(error);
  }
}

export default {
  getSummary,
};
