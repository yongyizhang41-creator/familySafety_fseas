import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import api from './api/axios';

import Navbar from './components/shared/Navbar';
import ProtectedRoute from './components/shared/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import SafeZones from './pages/SafeZones';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';
import Settings from './pages/Settings';

export default function App() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    // Attempt to hydrate user profile if a refresh cookie exists
    const initAuth = async () => {
      try {
        // On hard reload, accessToken is lost from memory.
        // First try to refresh the token via the HTTP-only cookie.
        const refreshRes = await api.post('/auth/refresh');
        const token = refreshRes.data.data.accessToken;

        // Fetch the user profile with the fresh access token
        const userRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuth(userRes.data.data.user, token);
      } catch {
        // No valid refresh cookie or refresh failed — user is logged out
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setAuth, clearAuth, setLoading]);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/safezones" element={<SafeZones />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1f2937', 
            color: '#fff',
            border: '1px solid #374151'
          }
        }} 
      />
    </BrowserRouter>
  );
}
