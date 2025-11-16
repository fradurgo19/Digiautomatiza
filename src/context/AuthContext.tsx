import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, AuthState, LoginCredentials } from '../types';

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
      // TODO: Implementar autenticación real con backend
      // Por ahora, simulamos login con credenciales predefinidas
      if (credentials.email === 'comercial@digiautomatiza.com' && credentials.password === 'comercial2025') {
        const usuario: Usuario = {
          id: '1',
          nombre: 'Usuario Comercial',
          email: credentials.email,
          rol: 'comercial',
          activo: true,
        };
        
        localStorage.setItem('usuario', JSON.stringify(usuario));
        setAuthState({
          usuario,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Credenciales inválidas');
      }
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

