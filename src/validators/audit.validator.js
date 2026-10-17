import mongoose from 'mongoose';

export function validateCreateAudit(req) {
  const projectId = req.params.projectId || req.body?.projectId;
  const errors = [];

  if (!projectId) {
    errors.push('Project ID is required to initiate an audit');
  } else if (!mongoose.Types.ObjectId.isValid(projectId)) {
    errors.push('Invalid Project ID format');
  }

  return errors;
}

export function validateAuditIdParam(req) {
  const auditId = req.params.id;
  const errors = [];

  if (!auditId || !mongoose.Types.ObjectId.isValid(auditId)) {
    errors.push('Invalid Audit ID');
  }

  return errors;
}

export default {
  validateCreateAudit,
  validateAuditIdParam,
};
