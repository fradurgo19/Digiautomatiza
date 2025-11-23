import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../atoms/Button';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/clientes', label: 'Clientes', icon: '👥' },
    { path: '/sesiones', label: 'Sesiones', icon: '📅' },
    { path: '/calendario', label: 'Calendario', icon: '📆' },
    { path: '/oportunidades', label: 'Oportunidades', icon: '📈' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img 
              src="https://res.cloudinary.com/dbufrzoda/image/upload/v1760908611/Captura_de_pantalla_2025-10-19_122805_v4gvpt.png" 
              alt="Digiautomatiza Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-lime-500 bg-clip-text text-transparent">
              Digiautomatiza
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors text-sm ${
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">{usuario?.nombre}</p>
              <p className="text-xs text-gray-500">{usuario?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

