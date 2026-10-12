import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathFor } from '../lib/routes';

/** Route guard. Without `role` any signed-in user passes; with `role` only that role does. */
export default function ProtectedRoute({ role }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />;
  return <Outlet />;
}
