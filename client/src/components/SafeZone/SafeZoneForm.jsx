import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import useGroupStore from '../../store/groupStore';
import Spinner from '../shared/Spinner';

export default function SafeZoneForm({ onComplete }) {
  const [formData, setFormData] = useState({ name: '', lat: '', lng: '', radius: 500 });
  const [loading, setLoading] = useState(false);
  const { addSafeZone } = useGroupStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Fetching location...', { id: 'loc-toast' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({ 
             ...prev, 
             lat: pos.coords.latitude.toFixed(6), 
             lng: pos.coords.longitude.toFixed(6) 
          }));
          toast.success('Location acquired. Adjust radius if needed.', { id: 'loc-toast' });
        },
        (err) => {
          toast.error(err.message, { id: 'loc-toast' });
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        radius: parseFloat(formData.radius)
      };

      const { data } = await api.post('/safezones/create', payload);
      addSafeZone(data.data.safeZone);
      toast.success('Safe zone created successfully');
      setFormData({ name: '', lat: '', lng: '', radius: 500 });
      if (onComplete) onComplete();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create safe zone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-xl p-8 flex flex-col gap-6 text-white shadow-2xl relative overflow-hidden group">
      
      {/* Decorative gradient orb */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-700"></div>

      <div className="relative z-10">
        <h3 className="text-2xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Create Boundary</h3>
        
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Boundary Name</label>
            <input 
              type="text" name="name" required value={formData.name} onChange={handleChange} 
              className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all" 
              placeholder="e.g. Grandma's House, School"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Latitude</label>
              <input 
                type="number" step="any" required name="lat" value={formData.lat} onChange={handleChange}
                className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all" 
                placeholder="0.000000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Longitude</label>
              <input 
                type="number" step="any" required name="lng" value={formData.lng} onChange={handleChange}
                className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all" 
                placeholder="0.000000"
              />
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleGetCurrentLocation} 
            className="flex items-center gap-2 self-start text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-full hover:bg-blue-500 hover:text-white transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/10"
          >
            <span>📍 Parse Current Location</span>
          </button>

          <div className="flex flex-col gap-2 mt-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Safe Radius</label>
              <span className="text-sm font-black text-blue-400">{formData.radius}m</span>
            </div>
            <input 
              type="range" required name="radius" min="50" max="5000" step="50" value={formData.radius} onChange={handleChange}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none focus:outline-none" 
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-3 px-4 rounded-lg transition-all flex justify-center disabled:opacity-50 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transform hover:-translate-y-0.5"
          >
            {loading ? <Spinner /> : 'Save Geofence'}
          </button>
        </div>
      </div>
    </form>
  );
}
