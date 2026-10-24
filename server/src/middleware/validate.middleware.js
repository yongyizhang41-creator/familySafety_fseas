import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Middleware: runs after express-validator checks.
 * If any validation errors exist, throws a 400 ApiError with the error details.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    throw new ApiError(400, 'Validation failed', extractedErrors);
  }

  next();
};

export default validate;
