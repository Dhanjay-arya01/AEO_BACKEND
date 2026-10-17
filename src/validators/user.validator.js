import mongoose from 'mongoose';

export function validateUpdateProfile(req) {
  const { name, avatarUrl, company } = req.body || {};
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('Name must be at least 2 characters long');
  }

  if (avatarUrl !== undefined && typeof avatarUrl !== 'string') {
    errors.push('Avatar URL must be a string');
  }

  if (company !== undefined && typeof company !== 'string') {
    errors.push('Company must be a string');
  }

  return errors;
}

export function validateStatusUpdate(req) {
  const { isActive } = req.body || {};
  const errors = [];

  if (isActive === undefined || typeof isActive !== 'boolean') {
    errors.push('Field "isActive" must be a boolean');
  }

  return errors;
}

export function validateUserIdParam(req) {
  const userId = req.params.id;
  const errors = [];

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    errors.push('Invalid User ID');
  }

  return errors;
}

export default {
  validateUpdateProfile,
  validateStatusUpdate,
  validateUserIdParam,
};
