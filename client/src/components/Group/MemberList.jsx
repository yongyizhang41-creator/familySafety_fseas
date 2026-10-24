import { useState } from 'react';
import useGroupStore from '../../store/groupStore';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '../../utils/formatDate';

export default function MemberList() {
  const { group, locations } = useGroupStore();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!group) return null;

  const isOwner = group.owner === user._id || (group.owner?._id === user._id);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await api.delete(`/groups/remove-member/${memberId}`);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave the group?")) return;
    try {
      await api.delete('/groups/leave');
      toast.success("Left group successfully");
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave group");
    }
  };

  return (
    <div className={`transition-all duration-300 ease-in-out bg-gray-900/80 backdrop-blur-xl border-r border-gray-800 text-white flex flex-col h-full shadow-2xl relative ${collapsed ? 'w-16 md:w-20' : 'w-full md:w-80'}`}>
      
      {/* Collapse Toggle */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-50 transition transform hover:scale-110 text-xs"
      >
        {collapsed ? '▶' : '◀'}
      </button>

      {/* Header */}
      <div className={`p-4 border-b border-gray-800 flex flex-col justify-center ${collapsed ? 'items-center pt-8' : ''}`}>
        {!collapsed && (
          <>
            <h2 className="font-extrabold text-xl mb-2 truncate bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{group.name}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded-lg border border-gray-800/50 w-fit transition hover:border-gray-600">
              <span>Code:</span>
              <code className="bg-danger/20 text-danger px-2 py-0.5 rounded font-mono font-bold tracking-widest border border-danger/30">{group.inviteCode}</code>
              <button onClick={handleCopyCode} className="hover:text-white transition hover:scale-110 ml-1" title="Copy invite code">
                {copied ? '✅' : '📋'}
              </button>
            </div>
          </>
        )}
        {collapsed && (
            <div className="font-bold text-lg text-gray-400 rotate-90 whitespace-nowrap mt-4 tracking-widest uppercase origin-center translate-y-8">GRUP</div>
        )}
      </div>
      
      {/* List */}
      <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {!collapsed && <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Active Roster</h3>}
        
        <ul className={`space-y-3 ${collapsed ? 'flex flex-col items-center mt-12' : ''}`}>
          {group.members.map((member, index) => {
            const isMe = member._id === user._id;
            const location = locations[member._id];
            const ringColor = `hsl(${index * 137.5 % 360}, 70%, 50%)`;
            
            return (
              <li key={member._id} className={`group flex flex-col bg-gray-900/40 border border-gray-800/50 hover:bg-gray-800/80 rounded-xl transition-all duration-200 transform ${!collapsed && 'hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]'} ${collapsed ? 'p-1 border-none bg-transparent hover:bg-transparent' : 'p-3'}`}>
                <div className={`flex justify-between items-center ${collapsed ? 'justify-center' : ''}`}>
                  <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                    
                    <div className={`rounded-full bg-gray-800 border-2 flex items-center justify-center font-bold relative shadow-lg ${collapsed ? 'w-10 h-10 text-sm border-[3px]' : 'w-12 h-12 text-lg border-2'} group-hover:shadow-[0_0_10px_var(--tw-shadow-color)] transition-all`}
                         style={{ borderColor: ringColor, '--tw-shadow-color': ringColor }}>
                      {member.name.charAt(0).toUpperCase()}
                      {isMe && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm animate-pulse"></div>}
                    </div>

                    {!collapsed && (
                        <div>
                        <p className="text-sm font-bold text-white flex items-center">
                            {member.name} {isMe && <span className="text-gray-500 font-normal text-xs ml-1">(You)</span>}
                            {group.owner === member._id && <span className="ml-1.5 text-[10px] uppercase font-black bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded-sm" title="Group Owner">Admin</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {location ? `Seen ${formatRelativeTime(location.timestamp)}` : 'Location masked'}
                        </p>
                        </div>
                    )}
                  </div>
                  
                  {!collapsed && isOwner && !isMe && (
                    <button 
                      onClick={() => handleRemoveMember(member._id)}
                      className="text-gray-500 border border-transparent hover:text-white hover:bg-danger hover:border-red-400 w-7 h-7 rounded flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      title="Kick member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer Actions */}
      <div className={`p-4 border-t border-gray-800 flex items-center ${collapsed ? 'justify-center' : ''}`}>
        {!collapsed ? (
            <button 
            onClick={handleLeaveGroup}
            disabled={isOwner}
            className="w-full h-12 text-center text-xs font-bold uppercase tracking-wider rounded-lg bg-red-500/5 text-danger border border-red-500/20 hover:bg-danger hover:text-white hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-red-500/5 disabled:hover:text-danger disabled:hover:shadow-none"
            title={isOwner ? "Cannot leave as owner" : ""}
            >
            Leave Group
            </button>
        ) : (
            <button
            onClick={handleLeaveGroup}
            disabled={isOwner}
            className="w-10 h-10 rounded-full bg-red-500/10 text-danger border border-red-500/20 hover:bg-danger hover:text-white transition flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed"
            title={isOwner ? "Cannot leave as owner" : "Leave Group"}
            >
            ✕
            </button>
        )}
      </div>
    </div>
  );
}
