import { useState } from 'react';
import useGroupStore from '../../store/groupStore';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import { formatRelativeTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function SOSModal() {
  const { activeSOSAlerts, removeActiveSOSAlert } = useGroupStore();
  const { user } = useAuthStore();
  const [resolvingId, setResolvingId] = useState(null);

  if (!activeSOSAlerts || activeSOSAlerts.length === 0) return null;

  // We can show the most recently triggered SOS, or a list if multiple. Let's just show the first active one for the full screen overlay.
  const alert = activeSOSAlerts[0];
  const isMe = alert.triggeredBy._id === user._id;

  const handleResolve = async () => {
    if (!window.confirm("Are you sure you want to resolve this SOS alert?")) return;
    setResolvingId(alert._id);

    try {
      await api.patch(`/sos/${alert._id}/resolve`);
      removeActiveSOSAlert(alert._id);
      toast.success("Alert resolved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve alert");
    } finally {
      setResolvingId(null);
    }
  };

  const mapLink = `https://www.google.com/maps/search/?api=1&query=${alert.lat},${alert.lng}`;

  return (
    <div className="fixed inset-0 z-[2000] bg-danger text-white flex flex-col items-center justify-center p-6 animate-pulse" style={{ animationDuration: '2s' }}>
      
      <div className="bg-darkbg text-white rounded-lg shadow-2xl overflow-hidden max-w-md w-full border-4 border-white animate-none">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="text-6xl mb-4">🚨</div>
          <h2 className="text-3xl font-extrabold uppercase tracking-wider mb-2 text-danger">SOS Alert</h2>
          
          <p className="text-xl mb-6">
            <strong className="text-white">{alert.triggeredBy.name}</strong> has triggered an emergency alert!
          </p>

          <div className="w-full bg-gray-900 rounded p-4 mb-6 text-left">
             <p className="text-sm text-gray-400 mb-1">Time: <span className="text-white">{formatRelativeTime(alert.createdAt)}</span></p>
             <p className="text-sm text-gray-400">Status: <span className="font-bold text-danger uppercase animate-pulse">Active</span></p>
          </div>

          <div className="flex flex-col gap-3 w-full">
             <a 
               href={mapLink} 
               target="_blank" 
               rel="noreferrer"
               className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-center rounded font-bold uppercase transition"
             >
               View on Google Maps
             </a>
             
             <button 
               onClick={handleResolve}
               disabled={resolvingId === alert._id}
               className="w-full py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-center rounded font-bold uppercase transition text-gray-300"
             >
               {resolvingId === alert._id ? 'Resolving...' : 'Mark as Resolved'}
             </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
