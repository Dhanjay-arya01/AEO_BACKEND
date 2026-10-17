import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { validateUpdateProfile } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.patch('/profile', validate(validateUpdateProfile), userController.updateProfile);
router.put('/profile', validate(validateUpdateProfile), userController.updateProfile);
router.post('/deactivate', userController.deactivateAccount);

export default router;
