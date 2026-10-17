export function sendSuccess(res, data = null, message = 'Success', statusCode = 200, meta = null) {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

export function sendError(res, message = 'Internal Server Error', statusCode = 500, errorCode = 'ERROR', details = null) {
  const payload = {
    success: false,
    error: {
      code: errorCode,
      message,
    },
  };

  if (details) {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
}

export default {
  sendSuccess,
  sendError,
};
