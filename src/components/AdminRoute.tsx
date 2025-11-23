import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../atoms/Loading';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, usuario } = useAuth();

  if (isLoading) {
    return <Loading fullScreen text="Verificando permisos..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (usuario?.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

