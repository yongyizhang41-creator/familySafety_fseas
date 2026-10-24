import SafeZone from '../models/SafeZone.model.js';
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { sendPushToMultiple } from './fcm.service.js';

/**
 * Haversine formula — calculates the great-circle distance (in meters)
 * between two geographic coordinates.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees).
 * @param {number} lng1 - Longitude of point 1 (degrees).
 * @param {number} lat2 - Latitude of point 2 (degrees).
 * @param {number} lng2 - Longitude of point 2 (degrees).
 * @returns {number} Distance in meters.
 */
export const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * In-memory zone state map.
 * Key: `${userId}:${zoneId}` → Value: 'inside' | 'outside' | null
 *
 * On server restart state resets to null — no false crossing events
 * will fire until at least 2 consecutive pings establish a baseline.
 */
const zoneStateMap = new Map();

/**
 * Checks whether a user has crossed any safe zone boundary.
 * Fires socket events, FCM pushes, and creates Notification docs on boundary crossings.
 *
 * @param {object} params
 * @param {string} params.userId - The user's _id.
 * @param {string} params.userName - The user's display name.
 * @param {string} params.groupId - The user's group _id.
 * @param {number} params.lat - Current latitude.
 * @param {number} params.lng - Current longitude.
 * @param {object} params.io - Socket.io server instance.
 */
export const checkGeofences = async ({ userId, userName, groupId, lat, lng, io }) => {
  try {
    const zones = await SafeZone.find({ group: groupId });

    for (const zone of zones) {
      const distance = haversine(lat, lng, zone.lat, zone.lng);
      const isInside = distance <= zone.radius;
      const stateKey = `${userId}:${zone._id}`;
      const previousState = zoneStateMap.get(stateKey);

      // Determine current state label
      const currentState = isInside ? 'inside' : 'outside';

      // First ping for this user-zone pair — establish baseline, no event
      if (previousState == null) {
        zoneStateMap.set(stateKey, currentState);
        continue;
      }

      // No state change — skip
      if (previousState === currentState) continue;

      // State changed — boundary crossed
      const direction = isInside ? 'entered' : 'exited';
      zoneStateMap.set(stateKey, currentState);

      const timestamp = new Date().toISOString();

      // Emit socket event to the group room
      io.to(`group:${groupId}`).emit('safezone:crossed', {
        userId,
        userName,
        zoneName: zone.name,
        direction,
        lat,
        lng,
        timestamp,
      });

      // Fetch all group members to send push notifications
      const groupMembers = await User.find({ group: groupId }).select('fcmToken');
      const fcmTokens = groupMembers
        .filter((m) => m._id.toString() !== userId)
        .map((m) => m.fcmToken);

      const title = `Safe Zone ${direction === 'entered' ? 'Entry' : 'Exit'}`;
      const body = `${userName} has ${direction} "${zone.name}"`;

      // Send FCM push to all group members (except the user who crossed)
      await sendPushToMultiple(fcmTokens, title, body, {
        type: 'geofence',
        zoneName: zone.name,
        direction,
        userId,
      });

      // Create a Notification document for each group member
      const notificationDocs = groupMembers
        .filter((m) => m._id.toString() !== userId)
        .map((m) => ({
          recipient: m._id,
          group: groupId,
          type: 'geofence',
          title,
          body,
          data: { zoneName: zone.name, direction, userId, lat, lng },
        }));

      if (notificationDocs.length > 0) {
        await Notification.insertMany(notificationDocs);
      }
    }
  } catch (error) {
    console.error('Geofence check error:', error.message);
  }
};
