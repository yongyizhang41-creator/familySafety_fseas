import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import Spinner from '../shared/Spinner';

export default function JoinGroup({ onSuccess }) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim() || inviteCode.length !== 8) {
      toast.error('Invite code must be exactly 8 characters');
      return;
    }
    setLoading(true);

    try {
      const { data } = await api.post('/groups/join', { inviteCode });
      updateUser({ group: data.data.group._id });
      toast.success('Joined group successfully!');
      if (onSuccess) onSuccess(data.data.group);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-400">Invite Code</label>
      <input
        type="text"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value.trim())}
        placeholder="8-character code"
        maxLength={8}
        disabled={loading}
        className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800 uppercase"
      />
      <button
        type="submit"
        disabled={loading || inviteCode.length !== 8}
        className="bg-darkbg text-white border border-gray-600 py-2 rounded flex justify-center hover:bg-gray-800 disabled:opacity-50 transition"
      >
        {loading ? <Spinner /> : 'Join Group'}
      </button>
    </form>
  );
}
