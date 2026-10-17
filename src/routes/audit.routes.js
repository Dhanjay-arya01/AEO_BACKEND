import { Router } from 'express';
import auditController from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { validateCreateAudit, validateAuditIdParam } from '../validators/audit.validator.js';

const router = Router();

router.use(authenticate);

// Direct audit endpoints
router.post('/', validate(validateCreateAudit), auditController.createAudit);
router.get('/', auditController.listProjectAudits);
router.get('/:id', validate(validateAuditIdParam), auditController.getAuditById);
router.get('/:id/progress', validate(validateAuditIdParam), auditController.getAuditProgress);
router.get('/:id/results', validate(validateAuditIdParam), auditController.getAuditResults);
router.post('/:id/retry', validate(validateAuditIdParam), auditController.retryAudit);
router.post('/:id/cancel', validate(validateAuditIdParam), auditController.cancelAudit);

export default router;
