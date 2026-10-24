import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware: verifies JWT access token from Authorization header.
 * Attaches the user document (minus password & refreshToken) to req.user.
 */
export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access token is missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(401, 'User not found for this token');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid or expired access token');
  }
});

/**
 * Middleware factory: restricts access to users with the specified role(s).
 */
export const authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to access this resource');
    }
    next();
  };
};

/**
 * Middleware: restricts access to the owner of the user's current group.
 */
export const requireGroupOwner = asyncHandler(async (req, _res, next) => {
  const { default: Group } = await import('../models/Group.model.js');

  if (!req.user.group) {
    throw new ApiError(400, 'You are not in any group');
  }

  const group = await Group.findById(req.user.group);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  if (group.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the group owner can perform this action');
  }

  req.group = group;
  next();
});
