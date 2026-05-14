import { useCallback, useState } from 'react';
import PaymentCheckout from '../molecules/PaymentCheckout';
import PaymentHistory from '../molecules/PaymentHistory';
import Card from '../atoms/Card';

export default function PaymentSection() {
  const [activeTab, setActiveTab] = useState<'checkout' | 'historial'>('checkout');

  const handlePaymentSuccess = useCallback((urlPago: string) => {
    // Redirigimos en la misma pestaña porque window.open dentro de un callback
    // asíncrono (tras un fetch) es frecuentemente bloqueado por los navegadores.
    // El checkout de Mercado Pago tiene su propio "Volver al sitio" para regresar.
    globalThis.location.assign(urlPago);
  }, []);

  const handlePaymentError = useCallback((error: string) => {
    alert(`Error: ${error}`);
  }, []);

  const handleSelectCheckout = useCallback(() => setActiveTab('checkout'), []);
  const handleSelectHistorial = useCallback(() => setActiveTab('historial'), []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <p className="text-center text-sm text-gray-500 mb-6">
        Tarjeta de crédito o débito, PSE, efectivo en puntos de pago y billetera Mercado Pago. Serás redirigido al checkout seguro de Mercado Pago para completar el pago.
      </p>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl backdrop-blur-sm border border-white/10">
        <button
          type="button"
          onClick={handleSelectCheckout}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'checkout'
              ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
          aria-pressed={activeTab === 'checkout'}
          aria-label="Realizar un pago"
        >
          💳 Realizar Pago
        </button>
        <button
          type="button"
          onClick={handleSelectHistorial}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'historial'
              ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
          aria-pressed={activeTab === 'historial'}
          aria-label="Ver historial de pagos"
        >
          📋 Historial
        </button>
      </div>

      {/* Content */}
      <Card className="p-8 bg-white/5 backdrop-blur-xl border border-white/10">
        {activeTab === 'checkout' ? (
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Realizar Pago
              </h3>
              <p className="text-gray-400">
                Completa el formulario. Serás redirigido a Mercado Pago para elegir tu método de pago y finalizar de forma segura.
              </p>
            </div>
            <PaymentCheckout
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Historial de Pagos
              </h3>
              <p className="text-gray-400">
                Ingresa tu correo para consultar el estado de tus transacciones realizadas con Mercado Pago.
              </p>
            </div>
            <PaymentHistory />
          </div>
        )}
      </Card>
    </div>
  );
}

