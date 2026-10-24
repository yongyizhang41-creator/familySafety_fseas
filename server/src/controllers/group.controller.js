import Group from '../models/Group.model.js';
import User from '../models/User.model.js';
import Location from '../models/Location.model.js';
import SOSAlert from '../models/SOSAlert.model.js';
import SafeZone from '../models/SafeZone.model.js';
import Notification from '../models/Notification.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { io } from '../../server.js';

// ─── POST /api/groups/create ───────────────────────────────────────────────────
export const createGroup = asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  if (req.user.group) {
    throw new ApiError(400, 'You are already in a group');
  }

  const group = await Group.create({ name, owner: req.user._id, members: [req.user._id] });
  
  // Update user's group reference
  await User.findByIdAndUpdate(req.user._id, { group: group._id });

  res.status(201).json(new ApiResponse(201, 'Group created successfully', { group }));
});

// ─── POST /api/groups/join ─────────────────────────────────────────────────────
export const joinGroup = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;

  if (req.user.group) {
    throw new ApiError(400, 'You are already in a group. Please leave it first.');
  }

  const group = await Group.findOne({ inviteCode });
  if (!group) {
    throw new ApiError(404, 'Invalid invite code');
  }

  if (!group.members.includes(req.user._id)) {
    group.members.push(req.user._id);
    await group.save();
  }

  await User.findByIdAndUpdate(req.user._id, { group: group._id });

  // Notify existing group members
  io.in(`group:${group._id}`).emit('member:joined', { userId: req.user._id, name: req.user.name });

  res.status(200).json(new ApiResponse(200, 'Joined group successfully', { group }));
});

// ─── GET /api/groups/mine ──────────────────────────────────────────────────────
export const getMyGroup = asyncHandler(async (req, res) => {
  if (!req.user.group) {
    throw new ApiError(404, 'You are not in any group');
  }

  const group = await Group.findById(req.user.group).populate('members', 'name email role fcmToken isLocationSharingOn');
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  res.status(200).json(new ApiResponse(200, 'Group fetched successfully', { group }));
});

// ─── DELETE /api/groups/leave ──────────────────────────────────────────────────
export const leaveGroup = asyncHandler(async (req, res) => {
  if (!req.user.group) {
    throw new ApiError(400, 'You are not in any group');
  }

  const group = await Group.findById(req.user.group);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  if (group.owner.toString() === req.user._id.toString()) {
    // Owner is leaving -> Cascade delete group and all related data
    await User.updateMany({ group: group._id }, { group: null });

    await Location.deleteMany({ group: group._id });
    await SOSAlert.deleteMany({ group: group._id });
    await SafeZone.deleteMany({ group: group._id });
    await Notification.deleteMany({ group: group._id });

    await group.deleteOne();

    // Evict all sockets from the group room and notify them
    io.in(`group:${group._id}`).emit('group:deleted');
    io.in(`group:${group._id}`).socketsLeave(`group:${group._id}`);

    return res.status(200).json(new ApiResponse(200, 'Group and all associated data deleted successfully'));
  }

  group.members = group.members.filter((memberId) => memberId.toString() !== req.user._id.toString());
  await group.save();

  await User.findByIdAndUpdate(req.user._id, { group: null });

  // Evict the leaving member from the group socket room
  io.in(`user:${req.user._id}`).socketsLeave(`group:${group._id}`);
  
  // Notify remaining group members
  io.in(`group:${group._id}`).emit('member:left', { userId: req.user._id, name: req.user.name });

  res.status(200).json(new ApiResponse(200, 'Left group successfully'));
});

// ─── DELETE /api/groups/remove-member/:userId [protected, owner only] ──────────
export const removeMember = asyncHandler(async (req, res) => {
   // This endpoint requires the group owner middleware (populates req.group)
   const targetUserId = req.params.userId;

   if (targetUserId === req.user._id.toString()) {
       throw new ApiError(400, 'You cannot remove yourself');
   }

   const userToRemove = await User.findById(targetUserId);
   if(!userToRemove || userToRemove.group?.toString() !== req.group._id.toString()){
        throw new ApiError(404, 'User not found in this group');
   }

   const group = req.group;
   group.members = group.members.filter(id => id.toString() !== targetUserId);
   await group.save();

   userToRemove.group = null;
   await userToRemove.save();

   // Notify and evict user from group socket room
   io.in(`user:${targetUserId}`).emit('group:kicked');
   io.in(`user:${targetUserId}`).socketsLeave(`group:${group._id}`);
   
   // Notify remaining group members
   io.in(`group:${group._id}`).emit('member:left', { userId: targetUserId, name: userToRemove.name });

   res.status(200).json(new ApiResponse(200, 'Member removed successfully'));
});
