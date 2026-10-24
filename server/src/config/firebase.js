import admin from 'firebase-admin';

/**
 * Initialises Firebase Admin SDK using the service account key from env.
 * FIREBASE_SERVICE_ACCOUNT_KEY should be a JSON string of the service account credentials.
 */
const initFirebase = () => {
  try {
    if (admin.apps.length === 0) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized');
    }
  } catch (error) {
    console.warn('Firebase Admin SDK init skipped (no valid service account key):', error.message);
  }
};

export { admin, initFirebase };
