import { useState } from 'react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../components/shared/Spinner';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    isLocationSharingOn: user?.isLocationSharingOn ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.patch('/auth/profile', formData);
      updateUser(data.data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkbg pt-20 p-4 md:p-8 text-white flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight mb-8">Account Settings</h1>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Name Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Display Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white focus:outline-danger transition"
                required
                minLength={2}
                maxLength={80}
              />
            </div>

            <hr className="border-gray-800 my-2" />

            {/* Ghost Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold text-white flex items-center gap-2">
                   Location Sharing (Ghost Mode) {formData.isLocationSharingOn ? '📡' : '👻'}
                </span>
                <span className="text-sm text-gray-400 max-w-md leading-relaxed">
                   When disabled, your location is immediately wiped from the map and stop broadcasting. SOS alerts will still function normally.
                </span>
              </div>
              
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, isLocationSharingOn: !formData.isLocationSharingOn })}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${formData.isLocationSharingOn ? 'bg-danger shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-600'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${formData.isLocationSharingOn ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-danger hover:bg-red-700 text-white font-bold py-4 rounded-lg transition transform hover:-translate-y-1 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] flex justify-center uppercase tracking-wider"
              >
                {loading ? <Spinner /> : 'Save Preferences'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
