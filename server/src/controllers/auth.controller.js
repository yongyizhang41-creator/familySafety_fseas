import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Location from '../models/Location.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { io } from '../../server.js';

/**
 * Helper: generate an access token (short-lived, 15 min).
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
};

/**
 * Helper: generate a refresh token (long-lived, 7 days).
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
};

/**
 * Helper: set the refresh token as an HTTP-only cookie on the response.
 */
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

// ─── POST /api/auth/register ───────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, fcmToken } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const user = await User.create({ name, email, password, ...(fcmToken && { fcmToken }) });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Hash and store refresh token in DB
  user.refreshToken = await bcrypt.hash(refreshToken, 12);
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    group: user.group,
    isLocationSharingOn: user.isLocationSharingOn,
    fcmToken: user.fcmToken,
  };

  res.status(201).json(new ApiResponse(201, 'User registered successfully', { user: userData, accessToken }));
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password, fcmToken } = req.body;

  // Explicitly select password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Save FCM token if provided
  if (fcmToken) {
    user.fcmToken = fcmToken;
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Hash and store refresh token in DB
  user.refreshToken = await bcrypt.hash(refreshToken, 12);
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    group: user.group,
    isLocationSharingOn: user.isLocationSharingOn,
  };

  res.status(200).json(new ApiResponse(200, 'Login successful', { user: userData, accessToken }));
});

// ─── POST /api/auth/logout [protected] ─────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null, fcmToken: null });

  // Clear the cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  res.status(200).json(new ApiResponse(200, 'Logged out successfully'));
});

// ─── POST /api/auth/refresh [reads cookie] ─────────────────────────────────────
export const refresh = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token not found');
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.userId).select('+refreshToken');
  if (!user || !user.refreshToken) {
    throw new ApiError(401, 'Refresh token has been revoked');
  }

  // Compare incoming token with the hashed token stored in DB
  const isValid = await bcrypt.compare(incomingRefreshToken, user.refreshToken);
  if (!isValid) {
    throw new ApiError(401, 'Refresh token mismatch');
  }

  // Rotate tokens
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = await bcrypt.hash(newRefreshToken, 12);
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, newRefreshToken);

  res.status(200).json(new ApiResponse(200, 'Tokens refreshed', { accessToken: newAccessToken }));
});

// ─── GET /api/auth/me [protected] ──────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('group', 'name inviteCode owner');

  res.status(200).json(new ApiResponse(200, 'User profile fetched', { user }));
});

// ─── PATCH /api/auth/profile [protected] ─────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, isLocationSharingOn } = req.body;
  
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  let sharingChangedToOff = false;

  if (name) user.name = name;
  
  if (typeof isLocationSharingOn === 'boolean') {
      if (user.isLocationSharingOn === true && isLocationSharingOn === false) {
          sharingChangedToOff = true;
      }
      user.isLocationSharingOn = isLocationSharingOn;
  }

  await user.save({ validateBeforeSave: false });

  // If user went into Ghost Mode, delete their location pings to immediately pull them off maps
  if (sharingChangedToOff) {
      await Location.deleteMany({ user: user._id });
  }

  // Notify group if sharing toggled
  if (typeof isLocationSharingOn === 'boolean' && user.group) {
      io.in(`group:${user.group}`).emit('sharing:changed', {
          userId: user._id,
          isLocationSharingOn: user.isLocationSharingOn
      });
  }

  const updatedUserData = await User.findById(req.user._id).populate('group', 'name inviteCode owner');

  res.status(200).json(new ApiResponse(200, 'Profile updated successfully', { user: updatedUserData }));
});
