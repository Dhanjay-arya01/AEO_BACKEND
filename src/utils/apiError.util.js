export class ApiError extends Error {
  constructor(statusCode, message, details = null, errorCode = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.errorCode = errorCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null, code = 'BAD_REQUEST') {
    return new ApiError(400, message, details, code);
  }

  static unauthorized(message = 'Unauthorized access', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, null, code);
  }

  static forbidden(message = 'Forbidden access', code = 'FORBIDDEN') {
    return new ApiError(403, message, null, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, null, code);
  }

  static conflict(message = 'Resource conflict', code = 'CONFLICT') {
    return new ApiError(409, message, null, code);
  }

  static internal(message = 'Internal server error', details = null, code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, details, code);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE') {
    return new ApiError(503, message, null, code);
  }
}

export default ApiError;
