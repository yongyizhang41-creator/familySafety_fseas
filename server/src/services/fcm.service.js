import { admin } from '../config/firebase.js';
import { clientOrigin } from '../config/origin.js';

/**
 * Sends a push notification to a single device via Firebase Cloud Messaging.
 * Silently catches errors so a failed push never breaks the main flow.
 *
 * @param {string} fcmToken - The recipient's FCM device token.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 * @param {object} [data={}] - Optional key-value data payload.
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;

  try {
    // Convert every data value to a string (FCM requirement)
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: stringData,
      webpush: {
        fcmOptions: {
          link: clientOrigin,
        },
      },
    };

    await admin.messaging().send(message);
  } catch (error) {
    console.error('FCM push failed:', error.message);
  }
};

/**
 * Sends a push notification to multiple devices.
 *
 * @param {string[]} fcmTokens - Array of FCM device tokens.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 * @param {object} [data={}] - Optional key-value data payload.
 */
export const sendPushToMultiple = async (fcmTokens, title, body, data = {}) => {
  const validTokens = fcmTokens.filter(Boolean);
  if (validTokens.length === 0) return;

  const promises = validTokens.map((token) => sendPushNotification(token, title, body, data));
  await Promise.allSettled(promises);
};
