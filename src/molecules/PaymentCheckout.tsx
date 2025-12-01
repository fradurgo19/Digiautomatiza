import { useState } from 'react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { crearPago } from '../services/paymentService';
import { DatosPago } from '../types';
import Loading from '../atoms/Loading';

interface PaymentCheckoutProps {
  onSuccess?: (urlPago: string) => void;
  onError?: (error: string) => void;
}

export default function PaymentCheckout({ onSuccess, onError }: PaymentCheckoutProps) {
  const [valor, setValor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [metodoPago, setMetodoPago] = useState<string>('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [documento, setDocumento] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!valor || parseFloat(valor) <= 0) {
      newErrors.valor = 'El valor debe ser mayor a 0';
    }

    if (!descripcion || descripcion.trim().length < 5) {
      newErrors.descripcion = 'La descripción debe tener al menos 5 caracteres';
    }

    if (!nombre || nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre es requerido (mínimo 2 caracteres)';
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email válido es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const datosPago = {
        valor: parseFloat(valor),
        descripcion: descripcion.trim(),
        metodoPago: metodoPago || undefined,
        compradorNombre: nombre.trim(),
        compradorEmail: email.trim(),
        compradorTelefono: telefono || undefined,
        compradorDocumento: documento || undefined,
        datosAdicionales: {
          telefono: telefono || undefined,
          documento: documento || undefined,
        },
      };

      const resultado = await crearPago(datosPago);

      if (resultado.urlPago) {
        // Redirigir al usuario a la página de pago
        if (onSuccess) {
          onSuccess(resultado.urlPago);
        } else {
          window.location.href = resultado.urlPago;
        }
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (error: any) {
      console.error('Error al crear pago:', error);
      const errorMessage = error.message || 'Error al procesar el pago';
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading text="Procesando pago..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del Comprador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-emerald-300 mb-2">
            Nombre Completo *
          </label>
          <Input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Juan Pérez"
            className={errors.nombre ? 'border-red-500' : ''}
            required
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-400">{errors.nombre}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-emerald-300 mb-2">
            Email *
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ej: juan@ejemplo.com"
            className={errors.email ? 'border-red-500' : ''}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Valor */}
      <div>
        <label className="block text-sm font-semibold text-emerald-300 mb-2">
          Valor a Pagar (COP)
        </label>
        <Input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Ej: 500000"
          min="1"
          step="1"
          className={errors.valor ? 'border-red-500' : ''}
          required
        />
        {errors.valor && (
          <p className="mt-1 text-sm text-red-400">{errors.valor}</p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-emerald-300 mb-2">
          Descripción del Pago
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Pago de servicios de desarrollo web"
          rows={3}
          className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all ${
            errors.descripcion ? 'border-red-500' : ''
          }`}
          required
        />
        {errors.descripcion && (
          <p className="mt-1 text-sm text-red-400">{errors.descripcion}</p>
        )}
      </div>

      {/* Método de Pago (Opcional) */}
      <div>
        <label className="block text-sm font-semibold text-emerald-300 mb-2">
          Método de Pago Preferido (Opcional)
        </label>
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
        >
          <option value="">Seleccionar método</option>
          <option value="tarjeta">Tarjeta de Crédito/Débito</option>
          <option value="pse">PSE (Pagos Seguros en Línea)</option>
          <option value="nequi">Nequi</option>
          <option value="daviplata">Daviplata</option>
        </select>
      </div>

      {/* Información Adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-emerald-300 mb-2">
            Teléfono (Opcional)
          </label>
          <Input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 3001234567"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-emerald-300 mb-2">
            Documento (Opcional)
          </label>
          <Input
            type="text"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="Ej: 1234567890"
          />
        </div>
      </div>

      {/* Botón de Enviar */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        size="lg"
        className="mt-6"
      >
        💳 Proceder al Pago
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Serás redirigido a la pasarela de pagos segura de PayU para completar la transacción
      </p>
    </form>
  );
}

