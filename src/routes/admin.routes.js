import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { validateUserIdParam, validateStatusUpdate } from '../validators/user.validator.js';
import { validateAuditIdParam } from '../validators/audit.validator.js';

const router = Router();

// Protect all admin endpoints with authentication and ADMIN role verification
router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/stats', adminController.getDashboard);
router.get('/users', adminController.listUsers);
router.get('/users/:id', validate(validateUserIdParam), adminController.getUserDetails);
router.patch(
  '/users/:id/status',
  validate(validateUserIdParam),
  validate(validateStatusUpdate),
  adminController.updateUserStatus
);
router.get('/projects', adminController.listProjects);
router.get('/audits', adminController.listAudits);
router.get('/audits/:id/failure', validate(validateAuditIdParam), adminController.getAuditFailure);
router.get('/queues', adminController.getQueueStatus);

export default router;
