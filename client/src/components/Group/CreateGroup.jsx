import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import Spinner from '../shared/Spinner';

export default function CreateGroup({ onSuccess }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUser } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const { data } = await api.post('/groups/create', { name });
      updateUser({ group: data.data.group._id });
      toast.success('Group created successfully!');
      if (onSuccess) onSuccess(data.data.group);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-400">Group Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter group name"
        disabled={loading}
        className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-danger"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="bg-danger text-white py-2 rounded flex justify-center hover:bg-red-700 disabled:opacity-50 transition"
      >
        {loading ? <Spinner /> : 'Create Group'}
      </button>
    </form>
  );
}
