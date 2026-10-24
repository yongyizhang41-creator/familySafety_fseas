import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import Spinner from '../components/shared/Spinner';
import useFCM from '../hooks/useFCM';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { fcmToken } = useFCM(); // Requests permission on mount and fetches token

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        fcmToken: fcmToken // Send FCM token if available
      };

      const { data } = await api.post('/auth/login', payload);
      
      const { user, accessToken } = data.data;
      setAuth(user, accessToken);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkbg flex flex-col justify-center items-center p-6 text-white pt-16">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded shadow-2xl">
        <h2 className="text-3xl font-extrabold mb-6 text-center tracking-tight">Welcome Back</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-400">Email Address</label>
            <input 
              type="email" name="email" required value={formData.email} onChange={handleChange} 
              className="bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white focus:outline-danger" 
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-400">Password</label>
            <input 
              type="password" name="password" required value={formData.password} onChange={handleChange} 
              className="bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white focus:outline-danger" 
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="mt-4 bg-danger hover:bg-red-700 text-white font-bold py-3 rounded transition flex justify-center uppercase tracking-wider"
          >
            {loading ? <Spinner /> : 'Log In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Don't have an account? <Link to="/register" className="text-danger hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
