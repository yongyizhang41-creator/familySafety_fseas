import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useGroupStore from '../store/groupStore';
import api from '../api/axios';
import toast from 'react-hot-toast';

const useSocket = () => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const { accessToken, user } = useAuthStore();
  const groupStore = useGroupStore();

  useEffect(() => {
    if (!accessToken || !user?.group) {
      // Clean up if conditions are no longer met
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000'), {
      auth: { token: accessToken },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket); // Trigger re-render so consumers get the socket

    // Setup event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      // If auth error, the token may have expired — try to reconnect with a fresh token
      if (err.message.includes('Authentication error')) {
        const freshToken = useAuthStore.getState().accessToken;
        if (freshToken && freshToken !== newSocket.auth.token) {
          newSocket.auth.token = freshToken;
          newSocket.connect();
        }
      }
    });

    newSocket.on('location:update', (payload) => {
      // payload: { userId, name, lat, lng, timestamp }
      useGroupStore.getState().updateMemberLocation(payload.userId, payload);
    });

    newSocket.on('sos:triggered', (payload) => {
      // payload: { alertId, triggeredBy: { _id, name }, lat, lng, createdAt }
      const normalizedAlert = {
         _id: payload.alertId,
         triggeredBy: payload.triggeredBy,
         lat: payload.lat,
         lng: payload.lng,
         createdAt: payload.createdAt
      };
      useGroupStore.getState().addActiveSOSAlert(normalizedAlert);
      toast.error(`SOS Triggered by ${payload.triggeredBy.name}!`, { duration: 5000 });
    });

    newSocket.on('sos:resolved', (payload) => {
      // payload: { alertId, resolvedBy: { _id, name }, resolvedAt }
      useGroupStore.getState().removeActiveSOSAlert(payload.alertId);
      toast.success(`SOS resolved by ${payload.resolvedBy?.name || 'someone'}`);
    });

    newSocket.on('safezone:crossed', (payload) => {
      // payload: { userId, userName, zoneName, direction: 'entered'|'exited', lat, lng, timestamp }
      const icon = payload.direction === 'entered' ? '✅' : '🚪';
      toast.success(`${payload.userName} ${payload.direction} ${payload.zoneName}`, { icon });
    });

    newSocket.on('checkin:received', (payload) => {
      // payload: { userId, userName, timestamp }
      toast.success(`${payload.userName} checked in safely.`);
    });

    newSocket.on('sharing:changed', (payload) => {
      // payload: { userId, isLocationSharingOn }
      useGroupStore.getState().updateMemberSharing(payload.userId, payload.isLocationSharingOn);
      
      const member = useGroupStore.getState().group?.members?.find(m => m._id === payload.userId);
      const name = member ? member.name : 'A member';
      
      if (payload.isLocationSharingOn) {
         toast(`${name} has resumed location sharing.`, { icon: '📍' });
      } else {
         toast(`${name} went into Ghost Mode 👻. Their location is now hidden.`, { icon: '👻' });
      }
    });

    newSocket.on('member:joined', async (payload) => {
      toast(`${payload.name} joined the group.`);
      try {
        const groupRes = await api.get('/groups/mine');
        useGroupStore.getState().setGroup(groupRes.data.data.group);
      } catch (err) {
        console.error('Failed to refetch group on member join');
      }
    });

    newSocket.on('member:left', async (payload) => {
      toast(`${payload.name || 'A member'} left the group.`);
      try {
        const groupRes = await api.get('/groups/mine');
        useGroupStore.getState().setGroup(groupRes.data.data.group);
      } catch (err) {
        console.error('Failed to refetch group on member leave');
      }
    });

    newSocket.on('group:kicked', () => {
      toast.error('You were removed from the group.');
      useGroupStore.getState().clearGroup();
      useAuthStore.getState().updateUser({ group: null });
    });

    newSocket.on('group:deleted', () => {
      toast.error('The group was deleted by the owner.');
      useGroupStore.getState().clearGroup();
      useAuthStore.getState().updateUser({ group: null });
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [accessToken, user?.group]);

  return socket;
};

export default useSocket;
