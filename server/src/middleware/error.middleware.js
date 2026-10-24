import ApiError from '../utils/ApiError.js';

/**
 * Global error-handling middleware.
 * Catches ApiError instances and unknown errors, returning the standard response shape.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let error = err;

  // Wrap non-ApiError instances so every response has the same shape
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`Status: ${error.statusCode} | Message: ${error.message}`);
    if (error.stack) console.error(error.stack);
  }

  const response = {
    success: false,
    message: error.message,
    data: null,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
