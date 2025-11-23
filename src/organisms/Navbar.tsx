import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../atoms/Button';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/clientes', label: 'Clientes', icon: '👥' },
    { path: '/sesiones', label: 'Sesiones', icon: '📅' },
    { path: '/calendario', label: 'Calendario', icon: '📆' },
    { path: '/oportunidades', label: 'Oportunidades', icon: '📈' },
    { path: '/propuestas', label: 'Propuestas', icon: '📄' },
    { path: '/dev', label: 'DEV', icon: '💻' },
  ];

  // Obtener el nombre del módulo actual
  const currentModule = navItems.find(item => item.path === location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleModuleSelect = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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

          {/* Menú Desplegable de Módulos */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isMenuOpen
                    ? 'bg-emerald-600 text-white'
                    : location.pathname !== '/dashboard'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-base">
                  {currentModule?.icon || '📋'}
                </span>
                <span>{currentModule?.label || 'Módulos'}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-[80vh] overflow-y-auto">
                  {navItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleModuleSelect(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        location.pathname === item.path
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                      {location.pathname === item.path && (
                        <span className="ml-auto text-emerald-600">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-700 leading-tight">{usuario?.nombre}</p>
              <p className="text-xs text-gray-500 leading-tight truncate max-w-[120px]">{usuario?.email}</p>
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

