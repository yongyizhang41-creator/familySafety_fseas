import User from '../models/User.model.js';
import Group from '../models/Group.model.js';
import Location from '../models/Location.model.js';
import SOSAlert from '../models/SOSAlert.model.js';
import SafeZone from '../models/SafeZone.model.js';
import Notification from '../models/Notification.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { io } from '../../server.js';

// ─── GET /api/admin/users [protected, role=admin] ─────────────────────────────
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password -refreshToken').sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, 'All users fetched', { users }));
});

// ─── GET /api/admin/groups [protected, role=admin] ────────────────────────────
export const getAllGroups = asyncHandler(async (req, res) => {
    const groups = await Group.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, 'All groups fetched', { groups }));
});

// ─── DELETE /api/admin/users/:userId [protected, role=admin] ──────────────────
export const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
        throw new ApiError(400, 'You cannot delete yourself via admin panel');
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.group) {
        const group = await Group.findById(user.group);
        if (group) {
            if (group.owner.toString() === userId.toString()) {
                // Owner was deleted -> Cascade delete group and all related data
                await User.updateMany({ group: group._id }, { group: null });

                await Location.deleteMany({ group: group._id });
                await SOSAlert.deleteMany({ group: group._id });
                await SafeZone.deleteMany({ group: group._id });
                await Notification.deleteMany({ group: group._id });

                await group.deleteOne();

                // Evict all sockets from the group room and notify them
                io.in(`group:${group._id}`).emit('group:deleted');
                io.in(`group:${group._id}`).socketsLeave(`group:${group._id}`);
            } else {
                // Regular member was deleted -> Pull them from group
                group.members = group.members.filter(id => id.toString() !== userId.toString());
                await group.save();

                // Evict the deleted user from the group socket room
                io.in(`user:${userId}`).emit('group:kicked');
                io.in(`user:${userId}`).socketsLeave(`group:${group._id}`);
            }
        }
    }

    res.status(200).json(new ApiResponse(200, 'User deleted successfully'));
});
