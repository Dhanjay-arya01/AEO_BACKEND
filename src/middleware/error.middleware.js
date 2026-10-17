import { NODE_ENV } from '../config/env.js';
import { ApiError } from '../utils/apiError.util.js';

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let details = err.details || null;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const fieldErrors = Object.values(err.errors).map((e) => e.message);
    message = fieldErrors[0] || 'Database validation failed';
    details = fieldErrors;
  }

  // Handle Mongoose CastError (e.g., malformed ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID_FORMAT';
    message = `Invalid value "${err.value}" for field "${err.path}"`;
  }

  // Handle MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyPattern || {})[0] || 'resource';
    message = `A record with this ${field} already exists.`;
  }

  // Log non-operational (unexpected) errors
  if (statusCode >= 500) {
    console.error('Unhandled Server Error:', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  const response = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  if (NODE_ENV === 'development' && statusCode >= 500) {
    response.error.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

export default errorHandler;
