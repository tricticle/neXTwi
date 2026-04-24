// api/utils/response-handler.js

/**
 * Standardized success response
 */
const sendSuccess = (res, data, statusCode = 200, message = null) => {
  const response = {
    success: true,
    ...(message && { message }),
    data,
  };
  return res.status(statusCode).json(response);
};

/**
 * Standardized error response
 */
const sendError = (res, error, statusCode = 500, code = 'INTERNAL_ERROR') => {
  const response = {
    success: false,
    error: error || 'An error occurred',
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
