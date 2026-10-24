import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Spinner from './Spinner';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkbg">
         <Spinner />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
