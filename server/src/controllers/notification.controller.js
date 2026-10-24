import Notification from '../models/Notification.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// ─── GET /api/notifications [protected] ────────────────────────────────────────
export const getNotifications = asyncHandler(async (req, res) => {
    // Get latest 50 notifications for the user
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json(new ApiResponse(200, 'Notifications fetched successfully', { notifications }));
});

// ─── PATCH /api/notifications/mark-read [protected] ────────────────────────────
export const markAsRead = asyncHandler(async (req, res) => {
    // Marks all unread notifications for the user as read.
    await Notification.updateMany(
        { recipient: req.user._id, read: false },
        { read: true }
    );

    res.status(200).json(new ApiResponse(200, 'Notifications marked as read', {}));
});
