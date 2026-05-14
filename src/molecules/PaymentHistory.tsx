import { useState } from 'react';
import { obtenerHistorialTransacciones } from '../services/paymentService';
import { Transaccion, EstadoTransaccion } from '../types';
import Loading from '../atoms/Loading';
import Card from '../atoms/Card';
import Input from '../atoms/Input';
import Button from '../atoms/Button';

export default function PaymentHistory() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const loadHistorial = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await obtenerHistorialTransacciones(email);
      setTransacciones(data);
      setHasSearched(true);
    } catch (err: unknown) {
      console.error('Error al cargar historial:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el historial');
      setTransacciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoBadge = (estado: EstadoTransaccion) => {
    const estilos = {
      pendiente: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      procesando: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      aprobada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      rechazada: 'bg-red-500/20 text-red-300 border-red-500/50',
      cancelada: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    };

    const labels = {
      pendiente: '⏳ Pendiente',
      procesando: '🔄 Procesando',
      aprobada: '✅ Aprobada',
      rechazada: '❌ Rechazada',
      cancelada: '🚫 Cancelada',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${estilos[estado] || estilos.pendiente}`}
      >
        {labels[estado] || estado}
      </span>
    );
  };

  const formatCurrency = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <Loading text="Buscando historial de pagos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Formulario de búsqueda */}
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">
          Consultar Historial de Pagos
        </h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu email para consultar tus pagos"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  loadHistorial();
                }
              }}
            />
          </div>
          <Button
            onClick={loadHistorial}
            variant="primary"
            disabled={isLoading}
          >
            Buscar
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </div>

      {/* Resultados */}
      {hasSearched && (
        <>
          {transacciones.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No se encontraron transacciones
              </h3>
              <p className="text-gray-400">
                No hay pagos registrados para este email
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Historial de Pagos ({transacciones.length})
                </h3>
                <button
                  type="button"
                  onClick={loadHistorial}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  🔄 Actualizar
                </button>
              </div>

              {transacciones.map((transaccion) => (
                <Card
                  key={transaccion.id}
                  className="p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-white">
                          {transaccion.descripcion || 'Pago sin descripción'}
                        </h4>
                        {getEstadoBadge(transaccion.estado)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Referencia:</span>
                          <p className="text-white font-mono">{transaccion.referencia}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Valor:</span>
                          <p className="text-emerald-300 font-semibold">
                            {formatCurrency(transaccion.valor)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Fecha:</span>
                          <p className="text-white">{formatDate(transaccion.createdAt)}</p>
                        </div>
                        {transaccion.metodoPago && (
                          <div>
                            <span className="text-gray-400">Método:</span>
                            <p className="text-white capitalize">{transaccion.metodoPago}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {transaccion.estado === 'pendiente' && transaccion.urlPago && (
                      <a
                        href={transaccion.urlPago}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-lime-500 text-white rounded-lg hover:from-emerald-600 hover:to-lime-600 transition-all font-semibold whitespace-nowrap"
                      >
                        Continuar Pago
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!hasSearched && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Consulta tu Historial
          </h3>
          <p className="text-gray-400">
            Ingresa tu email arriba para ver tus transacciones
          </p>
        </div>
      )}
    </div>
  );
}

