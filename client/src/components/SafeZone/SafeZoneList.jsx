import useGroupStore from '../../store/groupStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function SafeZoneList() {
  const { safeZones, removeSafeZone, group } = useGroupStore();
  const { user } = useAuthStore();
  
  const isOwner = group?.owner === user._id || group?.owner?._id === user._id;

  const handleDelete = async (zoneId) => {
    if (!window.confirm("Delete this safe zone?")) return;
    try {
      await api.delete(`/safezones/${zoneId}`);
      removeSafeZone(zoneId);
      toast.success("Safe zone deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete safe zone");
    }
  };

  if (safeZones.length === 0) {
    return <div className="text-gray-500 italic p-6 text-center border border-dashed border-gray-700 rounded-xl bg-gray-900/30 font-medium tracking-wide">No active geofences configured.</div>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {safeZones.map(zone => (
        <li key={zone._id} className="group bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl p-5 flex justify-between items-center text-white transition-all duration-300 hover:bg-gray-800/80 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:-translate-y-0.5">
          <div className="flex flex-col gap-2">
            <h4 className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{zone.name}</h4>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
               <span className="bg-gray-800 px-2 py-1 rounded-md text-gray-300">Lat: {zone.lat.toFixed(4)}</span>
               <span className="bg-gray-800 px-2 py-1 rounded-md text-gray-300">Lng: {zone.lng.toFixed(4)}</span>
               <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-1 rounded-md shadow-inner">Radius: {zone.radius}m</span>
            </div>
          </div>
          
          {isOwner && (
            <button 
              onClick={() => handleDelete(zone._id)}
              className="text-gray-500 hover:text-white bg-gray-800 hover:bg-danger border border-transparent hover:border-red-400 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md opacity-50 group-hover:opacity-100 hover:scale-110"
              title="Delete Geofence"
            >
              ✕
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
