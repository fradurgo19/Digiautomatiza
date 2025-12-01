import { useState } from 'react';
import PaymentCheckout from '../molecules/PaymentCheckout';
import PaymentHistory from '../molecules/PaymentHistory';
import Button from '../atoms/Button';
import Card from '../atoms/Card';

export default function PaymentSection() {
  const [activeTab, setActiveTab] = useState<'checkout' | 'historial'>('checkout');

  const handlePaymentSuccess = (urlPago: string) => {
    // Abrir la URL de pago en una nueva ventana
    window.open(urlPago, '_blank');
    // Cambiar a historial después de un momento
    setTimeout(() => {
      setActiveTab('historial');
    }, 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl backdrop-blur-sm border border-white/10">
        <button
          onClick={() => setActiveTab('checkout')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'checkout'
              ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          💳 Realizar Pago
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'historial'
              ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📋 Historial
        </button>
      </div>

      {/* Content */}
      <Card className="p-8 bg-white/5 backdrop-blur-xl border border-white/10">
        {activeTab === 'checkout' ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Realizar Pago
              </h2>
              <p className="text-gray-400">
                Completa el formulario para procesar tu pago de forma segura
              </p>
            </div>
            <PaymentCheckout
              onSuccess={handlePaymentSuccess}
              onError={(error) => {
                alert(`Error: ${error}`);
              }}
            />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Historial de Pagos
              </h2>
              <p className="text-gray-400">
                Consulta el estado de tus transacciones anteriores
              </p>
            </div>
            <PaymentHistory />
          </div>
        )}
      </Card>
    </div>
  );
}

