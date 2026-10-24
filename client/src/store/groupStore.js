import { create } from 'zustand';

const useGroupStore = create((set) => ({
  group: null, // The user's active group
  locations: {}, // map of userId -> latest location info
  activeSOSAlerts: [], // Array of active SOS alerts
  safeZones: [],
  notifications: [],

  setGroup: (group) => set({ group }),

  clearGroup: () => set({ group: null, locations: {}, activeSOSAlerts: [], safeZones: [] }),

  updateMemberSharing: (userId, isLocationSharingOn) =>
    set((state) => {
        if (!state.group) return state;
        
        // Update the member's isLocationSharingOn property
        const updatedMembers = state.group.members.map(m => 
            m._id === userId ? { ...m, isLocationSharingOn } : m
        );

        // If they turned sharing OFF, remove their location blip
        const newLocations = { ...state.locations };
        if (!isLocationSharingOn) {
            delete newLocations[userId];
        }

        return { 
            group: { ...state.group, members: updatedMembers },
            locations: newLocations
        };
    }),

  updateMemberLocation: (userId, locationData) =>
    set((state) => ({
      locations: {
        ...state.locations,
        [userId]: locationData,
      },
    })),
    
  setAllLocations: (locationsArray) =>
    set(() => {
        const locationsMap = {};
        locationsArray.forEach(loc => {
            // Aggregation returns `user` (ObjectId string), socket returns `userId`
            const key = loc.userId || loc.user;
            if (key) locationsMap[key] = loc;
        });
        return { locations: locationsMap };
    }),

  setActiveSOSAlerts: (alerts) => set({ activeSOSAlerts: alerts }),

  addActiveSOSAlert: (alert) =>
    set((state) => ({
      activeSOSAlerts: [alert, ...state.activeSOSAlerts.filter(a => a._id !== alert._id)],
    })),

  removeActiveSOSAlert: (alertId) =>
    set((state) => ({
      activeSOSAlerts: state.activeSOSAlerts.filter((a) => a._id !== alertId),
    })),

  setSafeZones: (zones) => set({ safeZones: zones }),
  
  addSafeZone: (zone) => set((state) => ({ safeZones: [...state.safeZones, zone] })),
  
  removeSafeZone: (zoneId) => set((state) => ({ safeZones: state.safeZones.filter(z => z._id !== zoneId) })),
  
  updateSafeZone: (updatedZone) => set((state) => ({
      safeZones: state.safeZones.map(z => z._id === updatedZone._id ? updatedZone : z)
  })),

  setNotifications: (notifications) => set({ notifications }),
  
  addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
}));

export default useGroupStore;
