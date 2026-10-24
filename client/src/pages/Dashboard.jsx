import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import useGroupStore from '../store/groupStore';
import useSocket from '../hooks/useSocket';
import useGeoLocation from '../hooks/useGeoLocation';
import api from '../api/axios';
import toast from 'react-hot-toast';

import MemberList from '../components/Group/MemberList';
import CreateGroup from '../components/Group/CreateGroup';
import JoinGroup from '../components/Group/JoinGroup';
import LiveMap from '../components/Map/LiveMap';
import MemberMarker from '../components/Map/MemberMarker';
import SafeZoneCircle from '../components/Map/SafeZoneCircle';
import SOSButton from '../components/SOS/SOSButton';
import SOSModal from '../components/SOS/SOSModal';
import Spinner from '../components/shared/Spinner';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { group, locations, safeZones, setGroup, setAllLocations, setSafeZones, setActiveSOSAlerts } = useGroupStore();
  const [loading, setLoading] = useState(true);

  // Initialize WebSockets and Geolocation tracking
  const socket = useSocket();
  const { error: geoError } = useGeoLocation(socket);

  useEffect(() => {
    if (geoError) {
      toast.error(`Geolocation error: ${geoError}`);
    }
  }, [geoError]);

  // Fetch initial data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.group) {
        setLoading(false);
        return;
      }

      try {
        const [groupRes, locRes, szRes, sosRes] = await Promise.all([
          api.get('/groups/mine'),
          api.get('/locations/latest'),
          api.get('/safezones'),
          api.get('/sos/active')
        ]);

        setGroup(groupRes.data.data.group);
        setAllLocations(locRes.data.data.locations || []);
        setSafeZones(szRes.data.data.safeZones || []);
        setActiveSOSAlerts(sosRes.data.data.activeAlerts || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        // Silently fail or toast
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.group]);

  if (loading) {
    return <div className="min-h-screen pt-16 flex items-center justify-center bg-darkbg"><Spinner /></div>;
  }

  if (!user.group) {
    return (
      <div className="min-h-screen bg-darkbg flex items-center justify-center p-6 text-white pt-16">
         <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 border border-gray-800 p-8 rounded shadow-2xl">
               <h2 className="text-2xl font-bold mb-4">Create a Group</h2>
               <p className="text-gray-400 mb-6 text-sm">Start a new family group and become the owner. You can invite members using a completely secure auto-generated code.</p>
               <CreateGroup />
            </div>
            <div className="bg-gray-900 border border-gray-800 p-8 rounded shadow-2xl">
               <h2 className="text-2xl font-bold mb-4">Join a Group</h2>
               <p className="text-gray-400 mb-6 text-sm">Have an invite code from a family member? Enter it here to join their existing secure group.</p>
               <JoinGroup />
            </div>
         </div>
      </div>
    );
  }

  const mapCenter = Object.values(locations)[0] 
     ? { lat: Object.values(locations)[0].lat, lng: Object.values(locations)[0].lng } 
     : { lat: 39.8283, lng: -98.5795 }; // Default US center if no locations

  return (
    <div className="h-screen pt-16 flex flex-col md:flex-row bg-darkbg text-white overflow-hidden relative">
      <SOSModal />
      
      {/* Sidebar List */}
      <div className="h-64 md:h-full z-10 shrink-0">
         <MemberList />
      </div>

      {/* Main Map Content */}
      <div className="flex-1 relative bg-[#242f3e]"> {/* Matches dark map color approx */}
        <LiveMap center={mapCenter} zoom={4}>
          {safeZones.map(zone => (
            <SafeZoneCircle 
               key={zone._id} 
               center={{ lat: zone.lat, lng: zone.lng }} 
               radius={zone.radius} 
               name={zone.name} 
            />
          ))}

          {group?.members?.map((member, index) => {
             const loc = locations[member._id];
             if (!loc) return null;
             return (
               <MemberMarker 
                 key={member._id}
                 name={member.name}
                 position={{ lat: loc.lat, lng: loc.lng }}
                 color={`hsl(${index * 137.5 % 360}, 70%, 50%)`}
                 lastSeen={new Date(loc.timestamp || loc.createdAt).toLocaleTimeString()}
               />
             );
          })}
        </LiveMap>

        {/* Action Overlays */}
        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
           <button 
             onClick={() => socket?.emit('checkin:send')}
             className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-gray-800 transition"
           >
             Check In Safely
           </button>
        </div>
      </div>
      
      <SOSButton />
    </div>
  );
}
