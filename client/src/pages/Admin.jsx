import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Spinner from '../components/shared/Spinner';
import { formatDate } from '../utils/formatDate';

export default function Admin() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchAdminData = async () => {
      try {
        const [usersRes, groupsRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/groups')
        ]);
        setUsers(usersRes.data.data.users);
        setGroups(groupsRes.data.data.groups);
      } catch (err) {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user?.role]);

  // Early returns must come AFTER all hook calls
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("WARNING: Irreversibly delete this user?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
      toast.success("User deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) return <div className="min-h-screen bg-darkbg pt-20 flex justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-darkbg pt-20 p-4 md:p-8 text-white flex flex-col gap-10">
      <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-danger to-red-400 uppercase tracking-widest pb-2 w-max drop-shadow-lg shadow-danger">Overlord Panel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Users Panel */}
        <div className="bg-gray-900/60 backdrop-blur-2xl border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-danger/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-danger/10 transition-all duration-700"></div>

          <h2 className="text-2xl font-black mb-8 flex justify-between items-center relative z-10">
             <span className="tracking-tight text-gray-200">System Identities</span>
             <span className="text-xs bg-danger/20 text-danger border border-danger/30 px-3 py-1.5 rounded-md font-bold shadow-inner flex items-center justify-center">{users.length} Total</span>
          </h2>
          
          <div className="overflow-x-auto relative z-10 custom-scrollbar rounded-xl border border-gray-800/50 bg-darkbg/40">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-20">
                   <tr className="text-xs uppercase tracking-widest text-gray-500 border-b border-gray-800">
                      <th className="py-4 pl-6 pr-4 font-bold">Name</th>
                      <th className="py-4 px-4 font-bold">Email Address</th>
                      <th className="py-4 px-4 font-bold">Privilege</th>
                      <th className="py-4 pr-6 text-right font-bold">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                   {users.map(u => (
                     <tr key={u._id} className="hover:bg-gray-800/40 transition-colors duration-200 group/row">
                       <td className="py-4 pl-6 pr-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-gray-400 shadow-inner group-hover/row:border-gray-500 transition-colors">
                               {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-200">{u.name} {u._id === user._id && <span className="text-gray-600 font-normal ml-1">(You)</span>}</span>
                         </div>
                       </td>
                       <td className="py-4 px-4 text-gray-400 font-medium">{u.email}</td>
                       <td className="py-4 px-4">
                         <span className={`px-3 py-1 rounded-md text-[10px] uppercase font-black tracking-widest border shadow-inner ${u.role === 'admin' ? 'bg-danger/10 text-danger border-danger/30 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                           {u.role}
                         </span>
                       </td>
                       <td className="py-4 pr-6 text-right">
                         {u._id !== user._id ? (
                           <button onClick={() => handleDeleteUser(u._id)} className="text-gray-500 hover:text-white hover:bg-danger border border-transparent hover:border-red-400 px-3 py-1.5 rounded-md transition-all text-xs font-bold uppercase tracking-wider opacity-0 group-hover/row:opacity-100 transform translate-x-2 group-hover/row:translate-x-0 shadow-md">Eradicate</button>
                         ) : (
                           <span className="text-xs text-gray-600 px-3 py-1.5 font-bold uppercase tracking-wider">Immune</span>
                         )}
                       </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Groups Panel */}
        <div className="bg-gray-900/60 backdrop-blur-2xl border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-600/10 transition-all duration-700"></div>

          <h2 className="text-2xl font-black mb-8 flex justify-between items-center relative z-10">
             <span className="tracking-tight text-gray-200">Active Clusters</span>
             <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-md font-bold shadow-inner flex items-center justify-center">{groups.length} Nodes</span>
          </h2>
          
          <ul className="flex flex-col gap-4 relative z-10">
             {groups.map(g => (
               <li key={g._id} className="bg-darkbg/50 p-5 rounded-xl border border-gray-800/80 flex flex-col gap-3 hover:bg-gray-800/30 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 group/card">
                 <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xl text-white tracking-tight">{g.name}</span>
                    <code className="text-blue-400 font-bold tracking-widest text-xs bg-blue-900/20 px-3 py-1.5 rounded-md border border-blue-500/20 shadow-inner group-hover/card:bg-blue-500/20 transition-colors">{g.inviteCode}</code>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mt-2 border-t border-gray-800/50 pt-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cluster Owner</span>
                        <span className="text-sm font-medium text-gray-300 truncate">{g.owner?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex flex-col gap-1 items-end text-right">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Population</span>
                        <span className="text-sm font-black text-gray-300">{g.members.length}</span>
                    </div>
                 </div>

                 <div className="text-xs text-gray-600 font-medium text-right mt-1 w-full flex justify-end">
                    Initiated {formatDate(g.createdAt, 'PP')}
                 </div>
               </li>
             ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
