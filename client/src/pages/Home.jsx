import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center pt-16 px-4 md:px-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-danger/20 to-transparent opacity-50 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-blue-900/10 to-transparent opacity-40 blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl w-full text-center flex flex-col items-center gap-8 z-10 relative mt-12 md:mt-24">
        
        <div className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-full inline-flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.3)]">
          <span className="text-xl">🚨</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-danger to-orange-500 pb-2">
          Family Safety <br /> & Emergency Alert System
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl font-light">
          Real-time GPS tracking, instant SOS alerts, and smart geofence notifications across your private family group.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto">
          <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-danger to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all transform hover:-translate-y-1 text-center text-lg uppercase tracking-wider">
            Get Started
          </Link>
          <Link to="/login" className="px-8 py-4 bg-gray-800/80 backdrop-blur-md hover:bg-gray-700 text-white font-bold rounded-lg border border-gray-700 transition-all transform hover:-translate-y-1 text-center text-lg uppercase tracking-wider">
            Login
          </Link>
        </div>

      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <FeatureCard 
          icon="📍" 
          title="Live Tracking" 
          description="View the exact real-time location of all connected group members securely on Google Maps." 
        />
        <FeatureCard 
          icon="🚨" 
          title="Instant SOS" 
          description="Trigger an emergency alert to instantly notify all group members with your exact location and a push notification." 
        />
        <FeatureCard 
          icon="🛡️" 
          title="Smart Safe Zones" 
          description="Draw virtual boundaries (geofences) and receive automatic notifications when members enter or leave." 
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-gray-600 p-8 rounded-2xl flex flex-col gap-4 items-start shadow-xl transition-all hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:-translate-y-2 relative overflow-hidden z-10">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-danger/10 to-transparent blur-2xl group-hover:from-danger/20 transition-all"></div>
      <div className="text-4xl bg-gray-800/80 p-3 rounded-xl border border-gray-700 shadow-inner group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-2xl font-bold tracking-tight text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed font-light">{description}</p>
    </div>
  );
}
