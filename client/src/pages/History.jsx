import { useState, useEffect } from 'react';
import useGroupStore from '../store/groupStore';
import api from '../api/axios';
import { formatRelativeTime, formatDate } from '../utils/formatDate';
import Spinner from '../components/shared/Spinner';
import toast from 'react-hot-toast';

export default function History() {
  const { group } = useGroupStore();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group?.members?.length > 0 && !selectedUserId) {
      setSelectedUserId(group.members[0]._id);
    }
  }, [group]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedUserId) return;
      setLoading(true);
      try {
        const { data } = await api.get(`/locations/history/${selectedUserId}`);
        setHistory(data.data.history);
      } catch (err) {
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedUserId]);

  if (!group) {
    return <div className="pt-24 p-6 text-center text-gray-400 font-bold uppercase tracking-widest">Join a group to view history.</div>;
  }

  return (
    <div className="min-h-screen bg-darkbg pt-20 p-4 md:p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 w-max">Location History Feed</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Member Selector */}
          <div className="w-full md:w-72 shrink-0 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Target Identity</h3>
            <div className="flex flex-col gap-2">
              {group.members.map(m => (
                <button
                  key={m._id}
                  onClick={() => setSelectedUserId(m._id)}
                  className={`text-left w-full px-5 py-4 rounded-xl border flex items-center justify-between transition-all duration-300 shadow-md transform hover:-translate-y-0.5 ${selectedUserId === m._id ? 'bg-danger/10 text-danger border-danger/40 font-black shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'bg-gray-900/60 backdrop-blur-md border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-600'}`}
                >
                  <span className="truncate pr-4">{m.name}</span>
                  {selectedUserId === m._id && <div className="w-2 h-2 rounded-full bg-danger shadow-[0_0_8px_rgba(220,38,38,1)] animate-pulse"></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="flex-1 bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 md:p-10 shadow-2xl relative min-h-[500px]">
             
             {/* Decorative Orb */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-danger/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10">
                {loading ? (
                <div className="flex justify-center items-center h-64 scale-150"><Spinner /></div>
                ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <span className="text-4xl mb-4 opacity-50">📡</span>
                    <p className="text-gray-500 font-bold tracking-wide">No location logs intercepted in the last 7 days.</p>
                </div>
                ) : (
                <div className="relative ml-2 md:ml-4 pb-4">
                    
                    {/* Glowing background track */}
                    <div className="absolute top-0 bottom-0 left-[6px] w-[2px] bg-gradient-to-b from-transparent via-red-900/30 to-transparent"></div>
                    <div className="absolute top-0 bottom-0 left-[6px] w-[2px] border-l-2 border-dashed border-gray-800"></div>

                    <div className="space-y-10">
                    {history.map((loc, idx) => (
                    <div key={loc._id || idx} className="relative pl-10 group">
                        
                        {/* Status Node */}
                        <div className="absolute w-4 h-4 bg-darkbg border-2 border-danger rounded-full -left-[1px] top-4 shadow-[0_0_15px_rgba(220,38,38,0.5)] group-hover:scale-125 group-hover:bg-danger transition-all duration-300 z-10"></div>
                        
                        {/* Data Card */}
                        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-800/80 rounded-xl p-5 shadow-lg group-hover:bg-gray-800/80 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] transform group-hover:-translate-y-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                                <span className="text-white font-extrabold tracking-wide drop-shadow-md">GPS Ping Intercepted</span>
                                <span className="text-xs font-bold text-gray-500 bg-gray-900/80 px-3 py-1.5 rounded-md border border-gray-800 inline-block fit-content whitespace-nowrap">
                                    {formatRelativeTime(loc.timestamp)} · <span className="text-gray-400">{formatDate(loc.timestamp, 'p')}</span>
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-sm">
                                    <span className="text-gray-500 font-bold mr-2 text-xs uppercase">Lat</span>
                                    <code className="text-blue-400 font-bold tracking-wider">{loc.lat.toFixed(6)}</code>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 text-sm">
                                    <span className="text-gray-500 font-bold mr-2 text-xs uppercase">Lng</span>
                                    <code className="text-green-400 font-bold tracking-wider">{loc.lng.toFixed(6)}</code>
                                </div>
                                {loc.accuracy && (
                                    <div className="bg-gray-900/80 border border-gray-700/50 rounded-lg px-4 py-2 text-sm shadow-inner">
                                        <span className="text-gray-500 font-bold mr-2 text-xs uppercase">Precision</span>
                                        <code className="text-gray-300 font-bold">±{Math.round(loc.accuracy)}m</code>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    ))}
                    </div>
                </div>
                )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
