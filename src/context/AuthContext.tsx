import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, AuthState, LoginCredentials } from '../types';

// URL del backend - En producción usa el dominio de producción
const API_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://www.digiautomatiza.co'
    : 'http://localhost:3000');

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    usuario: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Verificar si hay sesión guardada en localStorage
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        setAuthState({
          usuario,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        setAuthState({ usuario: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setAuthState({ usuario: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Credenciales inválidas');
      }

      const data = await response.json();
      const usuario: Usuario = data.usuario;

      localStorage.setItem('usuario', JSON.stringify(usuario));
      setAuthState({
        usuario,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('usuario');
    setAuthState({
      usuario: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}

