import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import toast from 'react-hot-toast';

// Setup Firebase app for foreground messages
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let messaging = null;

try {
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Firebase init failed (missing or invalid config in .env):', error);
}

const useFCM = () => {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    const requestPermission = async () => {
      if (!messaging) return;

      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // You must configure VAPID key conceptually in Firebase console
          // and export it to VITE_FIREBASE_VAPID_KEY
          const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();
          if (!vapidKey) return;

          // Get the service worker registration if available
          const swRegistration = await navigator.serviceWorker?.getRegistration();
          
          const tokenOptions = { vapidKey };
          if (swRegistration) {
            tokenOptions.serviceWorkerRegistration = swRegistration;
          }

          const currentToken = await getToken(messaging, tokenOptions);

          if (currentToken) {
            setFcmToken(currentToken);
          }
        }
      } catch (err) {
        console.error('Failed to get FCM token:', err);
      }
    };

    requestPermission();
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      // Fallback display if not handled by socket (e.g. background->foreground sync)
      // Usually socket events handle real-time UI when app is open
      const { title, body } = payload.notification;
      toast(`${title}: ${body}`, { icon: '🔔' });
    });

    return () => unsubscribe();
  }, []);

  return { fcmToken };
};

export default useFCM;
