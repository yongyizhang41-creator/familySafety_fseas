import { useEffect, useRef, useState, useCallback } from 'react';
import useAuthStore from '../store/authStore';

const EMIT_INTERVAL_MS = 10000; // Throttle: send at most every 10 seconds

const useGeoLocation = (socket) => {
  const [error, setError] = useState(null);
  const watcherRef = useRef(null);
  const lastEmitRef = useRef(0);

  // Read specific primitive values instead of the whole user object
  // to avoid re-running the effect on unrelated user updates
  const userGroup = useAuthStore((s) => s.user?.group);
  const isLocationSharingOn = useAuthStore((s) => s.user?.isLocationSharingOn);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // We only track and emit location if user is logged in, in a group, sharing is on, and socket exists
    if (!isAuthenticated || !userGroup || !isLocationSharingOn || !socket) {
      if (watcherRef.current !== null) {
        navigator.geolocation.clearWatch(watcherRef.current);
        watcherRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const handleSuccess = (position) => {
      const now = Date.now();

      // Throttle emissions to avoid flooding the server
      if (now - lastEmitRef.current < EMIT_INTERVAL_MS) return;
      lastEmitRef.current = now;

      const payload = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      // Emit to socket
      socket.emit('location:update', payload);
    };

    const handleError = (err) => {
      setError(err.message);
    };

    // Watch position
    watcherRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    });

    return () => {
      if (watcherRef.current !== null) {
        navigator.geolocation.clearWatch(watcherRef.current);
        watcherRef.current = null;
      }
    };
  }, [isAuthenticated, userGroup, isLocationSharingOn, socket]);

  return { error };
};

export default useGeoLocation;
