import { Router } from 'express';
import projectController from '../controllers/project.controller.js';
import auditController from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { validateCreateProject, validateUpdateProject } from '../validators/project.validator.js';
import { validateCreateAudit } from '../validators/audit.validator.js';

const router = Router();

router.use(authenticate);

// Project CRUD
router.post('/', validate(validateCreateProject), projectController.createProject);
router.get('/', projectController.listProjects);
router.get('/:id', projectController.getProjectById);
router.patch('/:id', validate(validateUpdateProject), projectController.updateProject);
router.put('/:id', validate(validateUpdateProject), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Nested Audits for convenience
router.post('/:projectId/audits', validate(validateCreateAudit), auditController.createAudit);
router.get('/:projectId/audits', auditController.listProjectAudits);

export default router;
