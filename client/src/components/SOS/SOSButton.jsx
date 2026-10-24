import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function SOSButton() {
  const [loading, setLoading] = useState(false);

  const handleTriggerSOS = async () => {
    if (!window.confirm("CRITICAL: Are you sure you want to trigger an SOS alert? This will notify your entire group immediately.")) {
      return;
    }

    setLoading(true);

    // Get fresh location instantly
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.post('/sos/trigger', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            toast.success("SOS Alert triggered successfully!", { icon: '🚨' });
          } catch (error) {
            toast.error(error.response?.data?.message || "Failed to trigger SOS");
            console.error(error);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          toast.error("Could not get location for SOS: " + err.message);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error('Geolocation not supported by browser');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTriggerSOS}
      disabled={loading}
      className={`fixed bottom-6 right-6 z-[1000] w-[72px] h-[72px] rounded-full bg-danger text-white flex items-center justify-center font-bold text-xl uppercase shadow-[0_0_20px_rgba(220,38,38,0.7)] transition-all ${loading ? 'opacity-70' : 'hover:scale-110 active:scale-95 animate-pulse'}`}
      title="Trigger SOS Alert"
    >
      {loading ? '...' : 'SOS'}
    </button>
  );
}
