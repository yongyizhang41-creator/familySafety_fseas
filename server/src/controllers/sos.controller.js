import SOSAlert from '../models/SOSAlert.model.js';
import User from '../models/User.model.js';
import Notification from '../models/Notification.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendPushToMultiple } from '../services/fcm.service.js';
import { io } from '../../server.js';

// ─── POST /api/sos/trigger ─────────────────────────────────────────────────────
export const triggerSOS = asyncHandler(async (req, res) => {
   const { lat, lng } = req.body;

   if (!req.user.group) {
       throw new ApiError(400, 'You must be in a group to trigger SOS');
   }

   const alert = await SOSAlert.create({
       triggeredBy: req.user._id,
       group: req.user.group,
       lat,
       lng,
       status: 'active'
   });

   // Notify group members
   const groupMembers = await User.find({ group: req.user.group }).select('fcmToken name');
   const fcmTokens = groupMembers
      .filter((m) => m._id.toString() !== req.user._id.toString() && m.fcmToken)
      .map((m) => m.fcmToken);

   const title = 'SOS Alert!';
   const body = `${req.user.name} has triggered an SOS alert!`;

   // Send Push Notification
   await sendPushToMultiple(fcmTokens, title, body, { type: 'sos', alertId: alert._id.toString(), lat, lng });

   // Create Notifications in DB
   const notificationDocs = groupMembers
     .filter((m) => m._id.toString() !== req.user._id.toString())
     .map((m) => ({
       recipient: m._id,
       group: req.user.group,
       type: 'sos',
       title,
       body,
       data: { alertId: alert._id.toString(), lat, lng, triggerName: req.user.name },
     }));

   if (notificationDocs.length > 0) {
     await Notification.insertMany(notificationDocs);
   }

   // Emit real-time socket event to group
   io.to(`group:${req.user.group}`).emit('sos:triggered', {
     alertId: alert._id,
     triggeredBy: { _id: req.user._id, name: req.user.name },
     lat: alert.lat,
     lng: alert.lng,
     createdAt: alert.createdAt,
   });

   res.status(201).json(new ApiResponse(201, 'SOS Alert triggered', { alert }));
});

// ─── PATCH /api/sos/:alertId/resolve ───────────────────────────────────────────
export const resolveSOS = asyncHandler(async (req, res) => {
    const { alertId } = req.params;

    const alert = await SOSAlert.findById(alertId);
    if (!alert) {
        throw new ApiError(404, 'SOS Alert not found');
    }

    if (alert.group.toString() !== req.user.group?.toString()) {
        throw new ApiError(403, 'You do not have permission to resolve this alert');
    }

    if (alert.status === 'resolved') {
        throw new ApiError(400, 'Alert is already resolved');
    }

    alert.status = 'resolved';
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    await alert.save();

    // Emit real-time socket event to group
    io.to(`group:${req.user.group}`).emit('sos:resolved', {
      alertId: alert._id,
      resolvedBy: { _id: req.user._id, name: req.user.name },
      resolvedAt: alert.resolvedAt,
    });

    res.status(200).json(new ApiResponse(200, 'SOS Alert resolved', { alert }));
});

// ─── GET /api/sos/active ───────────────────────────────────────────────────────
export const getActiveSOS = asyncHandler(async (req, res) => {
    if (!req.user.group) {
        throw new ApiError(400, 'You must be in a group');
    }

    const activeAlerts = await SOSAlert.find({ group: req.user.group, status: 'active' }).populate('triggeredBy', 'name');

    res.status(200).json(new ApiResponse(200, 'Active SOS alerts fetched', { activeAlerts }));
});

// ─── GET /api/sos/history ──────────────────────────────────────────────────────
export const getSOSHistory = asyncHandler(async (req, res) => {
    if (!req.user.group) {
        throw new ApiError(400, 'You must be in a group');
    }

    const alerts = await SOSAlert.find({ group: req.user.group })
                                 .populate('triggeredBy', 'name')
                                 .populate('resolvedBy', 'name')
                                 .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, 'SOS history fetched', { alerts }));
});
