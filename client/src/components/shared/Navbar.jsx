import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import NotificationBell from '../Notification/NotificationBell';

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const linkClass = (path) => `transition px-3 py-2 rounded-md text-sm font-medium ${isActive(path) ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-darkbg border-b border-gray-800 flex justify-between items-center px-4 md:px-6 z-50 text-white shadow-md">
      <Link to={user ? "/dashboard" : "/"} className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
         <span className="text-danger">FSEAS</span> Safety
      </Link>
      
      {user ? (
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-1 mr-4">
            <Link to="/dashboard" className={linkClass('/dashboard')}>Map</Link>
            <Link to="/safezones" className={linkClass('/safezones')}>Safe Zones</Link>
            <Link to="/history" className={linkClass('/history')}>History</Link>
            {user.role === 'admin' && (
              <Link to="/admin" className={linkClass('/admin')}>Admin</Link>
            )}
          </div>
          <NotificationBell />
          <Link to="/settings" className="hidden lg:flex items-center gap-2 group px-3 py-1.5 rounded-md transition hover:bg-gray-800">
             <span className="text-sm text-gray-400 group-hover:text-white transition">Hello, <strong>{user.name}</strong></span>
             <span className="text-gray-500 group-hover:text-white group-hover:rotate-90 transition-transform duration-300">⚙️</span>
          </Link>
          <button onClick={handleLogout} className="text-sm bg-gray-800 hover:bg-danger/80 px-3 py-1.5 rounded transition">Logout</button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link to="/login" className="text-gray-300 hover:text-white transition">Login</Link>
          <Link to="/register" className="text-danger hover:text-red-400 font-medium transition">Register</Link>
        </div>
      )}
    </nav>
  );
}
