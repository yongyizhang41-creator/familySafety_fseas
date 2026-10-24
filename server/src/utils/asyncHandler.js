/**
 * Higher-order function that wraps async route handlers.
 * Catches rejected promises and forwards them to Express error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
