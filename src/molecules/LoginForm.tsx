import { useState } from 'react';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import { LoginCredentials } from '../types';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  onCancel?: () => void;
}

export default function LoginForm({ onSubmit, onCancel }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!credentials.email || !credentials.password) {
      setError('Por favor complete todos los campos');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(credentials);
    } catch (err) {
      setError('Credenciales inválidas. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Iniciar Sesión
      </h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <Input
        label="Email"
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        fullWidth
        placeholder="comercial@digiautomatiza.com"
        autoComplete="username"
      />
      
      <Input
        label="Contraseña"
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        fullWidth
        placeholder="••••••••"
        autoComplete="current-password"
      />
      
      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onCancel}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isSubmitting}
        >
          Iniciar Sesión
        </Button>
      </div>
      
      <p className="text-sm text-gray-600 text-center mt-4">
        Solo para personal autorizado de Digiautomatiza
      </p>
    </form>
  );
}

