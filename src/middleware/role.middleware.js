import { ApiError } from '../utils/apiError.util.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
          'ROLE_UNAUTHORIZED'
        )
      );
    }

    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
export default requireRole;
