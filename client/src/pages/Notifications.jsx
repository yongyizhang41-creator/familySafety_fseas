import { useEffect, useState } from 'react';
import useGroupStore from '../store/groupStore';
import api from '../api/axios';
import { formatRelativeTime } from '../utils/formatDate';
import Spinner from '../components/shared/Spinner';
import toast from 'react-hot-toast';

export default function Notifications() {
  const { notifications, setNotifications } = useGroupStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndMarkRead = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.data.notifications);

        // Mark as read immediately on viewing
        if (data.data.notifications.some(n => !n.read)) {
            await api.patch('/notifications/mark-read');
            // Update local state to reflect read status
            setNotifications(data.data.notifications.map(n => ({ ...n, read: true })));
        }
      } catch (err) {
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchAndMarkRead();
  }, [setNotifications]);

  if (loading) {
    return <div className="min-h-screen pt-24 flex items-center justify-center bg-darkbg"><Spinner /></div>;
  }

  return (
    <div className="min-h-screen bg-darkbg pt-20 p-4 md:p-8 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 tracking-tight">Notifications</h1>
        
        {notifications.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded p-8 text-center text-gray-500">
             You have no notifications yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {notifications.map(notif => (
              <li 
                 key={notif._id} 
                 className={`p-5 rounded-lg border flex flex-col gap-2 shadow-lg transition
                 ${notif.type === 'sos' ? 'bg-danger/10 border-danger/50' : 'bg-gray-900 border-gray-800'}`}
              >
                  <div className="flex justify-between items-start">
                     <h3 className={`font-bold text-lg ${notif.type === 'sos' ? 'text-danger' : 'text-white'}`}>
                        {notif.title}
                     </h3>
                     <span className="text-xs text-gray-500">{formatRelativeTime(notif.createdAt)}</span>
                  </div>
                  <p className="text-gray-300">{notif.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
