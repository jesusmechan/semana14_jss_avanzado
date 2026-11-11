import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { autenticado } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    const volver = location.pathname + location.search;
    return <Navigate to={`/cuenta?volver=${encodeURIComponent(volver)}`} replace />;
  }

  return children;
}
