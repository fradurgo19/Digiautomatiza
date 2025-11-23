import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../organisms/Navbar';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import Modal from '../molecules/Modal';
import Loading from '../atoms/Loading';
import { useAuth } from '../context/AuthContext';
import { Propuesta, EstadoAprobacion } from '../types';
import { obtenerPropuestas } from '../services/databaseService';
// Función para formatear moneda
const formatearMoneda = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
};

const serviciosOptions: { value: string; label: string; icon: string }[] = [
  { value: 'paginas-web', label: 'Páginas Web', icon: '🌐' },
  { value: 'aplicaciones-web', label: 'Aplicaciones Web', icon: '💻' },
  { value: 'chatbot-ia', label: 'Chatbot con IA', icon: '🤖' },
  { value: 'automatizacion', label: 'Automatización', icon: '⚙️' },
  { value: 'analisis-datos', label: 'Análisis de Datos', icon: '📊' },
  { value: 'sap-hana', label: 'Soporte SAP ERP & HANA', icon: '🏭' },
];

export default function DevPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [propuestaSeleccionada, setPropuestaSeleccionada] = useState<Propuesta | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Verificar si el usuario es administrador
  useEffect(() => {
    if (usuario && usuario.rol !== 'admin') {
      // Redirigir a dashboard si no es admin
      navigate('/dashboard');
    }
  }, [usuario, navigate]);

  useEffect(() => {
    const cargarPropuestas = async () => {
      setIsLoading(true);
      try {
        const todasLasPropuestas = await obtenerPropuestas();
        // Filtrar solo las propuestas aprobadas
        const propuestasAprobadas = todasLasPropuestas.filter(
          p => p.estadoAprobacion === 'Aprobada'
        );
        setPropuestas(propuestasAprobadas);
      } catch (error) {
        console.error('Error al cargar propuestas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (usuario?.rol === 'admin') {
      cargarPropuestas();
    }
  }, [usuario]);

  const handleVerPropuesta = (propuesta: Propuesta) => {
    setPropuestaSeleccionada(propuesta);
    setIsModalOpen(true);
  };

  const formatearFecha = (fecha?: Date): string => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Si no es admin, no mostrar nada (será redirigido)
  if (usuario?.rol !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-green-100 to-emerald-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-green-100 to-emerald-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-100 via-green-100 to-emerald-50 text-gray-900 overflow-hidden">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Card className="bg-white/85 border border-emerald-100 shadow-lg shadow-emerald-100/50 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">💻 Módulo de Desarrollo</h1>
              <p className="text-gray-600">
                Propuestas aprobadas listas para comenzar el desarrollo
              </p>
            </div>
            <Badge variant="success" className="text-lg px-4 py-2">
              {propuestas.length} {propuestas.length === 1 ? 'Propuesta' : 'Propuestas'} Aprobada{propuestas.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </Card>

        {/* Lista de Propuestas Aprobadas */}
        {propuestas.length === 0 ? (
          <Card className="bg-white/85 border border-emerald-100">
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">💻</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No hay propuestas aprobadas
              </h3>
              <p className="text-gray-600 mb-4">
                Las propuestas aprobadas por el comercial aparecerán aquí para comenzar el desarrollo
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {propuestas.map((propuesta) => {
              const servicioInfo = serviciosOptions.find(s => s.value === propuesta.servicio);
              
              return (
                <Card key={propuesta.id} className="bg-white/85 border border-emerald-100 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {propuesta.titulo}
                        </h3>
                        <Badge variant="success">
                          ✅ Aprobada
                        </Badge>
                        {propuesta.adjuntos && propuesta.adjuntos.length > 0 && (
                          <span className="text-emerald-600" title={`${propuesta.adjuntos.length} archivo(s) adjunto(s)`}>
                            📎 {propuesta.adjuntos.length}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 mb-3">
                        <div>
                          <p><strong>Cliente:</strong> {propuesta.cliente.nombre}</p>
                          <p><strong>Empresa:</strong> {propuesta.cliente.empresa || 'N/A'}</p>
                          <p><strong>Email:</strong> {propuesta.cliente.email}</p>
                          <p><strong>Teléfono:</strong> {propuesta.cliente.telefono}</p>
                        </div>
                        <div>
                          <p><strong>Servicio:</strong> {servicioInfo?.icon} {servicioInfo?.label}</p>
                          <p><strong>Número:</strong> {propuesta.numeroPropuesta}</p>
                          <p><strong>Comercial:</strong> {propuesta.cliente.nombre}</p>
                        </div>
                        <div>
                          <p><strong>Valor Total:</strong> {formatearMoneda(propuesta.valorTotal)}</p>
                          <p><strong>Descuento:</strong> {propuesta.descuento ? formatearMoneda(propuesta.descuento) : 'N/A'}</p>
                          <p><strong>Valor Final:</strong> {formatearMoneda(propuesta.valorFinal)}</p>
                          <p><strong>Vence:</strong> {formatearFecha(propuesta.fechaVencimiento)}</p>
                        </div>
                      </div>

                      {propuesta.especificaciones && (
                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                          <p className="text-sm font-semibold text-emerald-800 mb-1">Especificaciones del Servicio:</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{propuesta.especificaciones}</p>
                        </div>
                      )}

                      {propuesta.notas && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-semibold text-blue-800 mb-1">Notas Internas:</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{propuesta.notas}</p>
                        </div>
                      )}

                      {propuesta.adjuntos && propuesta.adjuntos.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Archivos Adjuntos:</p>
                          <div className="flex flex-wrap gap-2">
                            {propuesta.adjuntos.map((adjunto, index) => (
                              <a
                                key={index}
                                href={adjunto.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                              >
                                <span>{adjunto.tipo === 'imagen' ? '🖼️' : '📄'}</span>
                                <span className="text-sm">{adjunto.nombre}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleVerPropuesta(propuesta)}
                      >
                        👁️ Ver Detalles
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal Ver Propuesta */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setPropuestaSeleccionada(null);
          }}
          title={`Propuesta: ${propuestaSeleccionada?.titulo || ''}`}
          size="xl"
        >
          {propuestaSeleccionada && (
            <div className="space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Cliente:</p>
                  <p className="text-gray-900">{propuestaSeleccionada.cliente.nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Empresa:</p>
                  <p className="text-gray-900">{propuestaSeleccionada.cliente.empresa || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Email:</p>
                  <p className="text-gray-900">{propuestaSeleccionada.cliente.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Teléfono:</p>
                  <p className="text-gray-900">{propuestaSeleccionada.cliente.telefono}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Número de Propuesta:</p>
                  <p className="text-gray-900">{propuestaSeleccionada.numeroPropuesta}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Servicio:</p>
                  <p className="text-gray-900">
                    {serviciosOptions.find(s => s.value === propuestaSeleccionada.servicio)?.icon}{' '}
                    {serviciosOptions.find(s => s.value === propuestaSeleccionada.servicio)?.label}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Valor Total:</p>
                  <p className="text-gray-900">{formatearMoneda(propuestaSeleccionada.valorTotal)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Descuento:</p>
                  <p className="text-gray-900">
                    {propuestaSeleccionada.descuento ? formatearMoneda(propuestaSeleccionada.descuento) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Valor Final:</p>
                  <p className="text-gray-900 font-bold text-emerald-600">
                    {formatearMoneda(propuestaSeleccionada.valorFinal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Fecha de Vencimiento:</p>
                  <p className="text-gray-900">{formatearFecha(propuestaSeleccionada.fechaVencimiento)}</p>
                </div>
              </div>

              {propuestaSeleccionada.especificaciones && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Especificaciones del Servicio:</p>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{propuestaSeleccionada.especificaciones}</p>
                  </div>
                </div>
              )}

              {propuestaSeleccionada.notas && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Notas Internas:</p>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{propuestaSeleccionada.notas}</p>
                  </div>
                </div>
              )}

              {propuestaSeleccionada.adjuntos && propuestaSeleccionada.adjuntos.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Archivos Adjuntos:</p>
                  <div className="space-y-2">
                    {propuestaSeleccionada.adjuntos.map((adjunto, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-2xl">{adjunto.tipo === 'imagen' ? '🖼️' : '📄'}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{adjunto.nombre}</p>
                          <p className="text-sm text-gray-600">
                            {adjunto.tamaño ? `${(adjunto.tamaño / 1024).toFixed(2)} KB` : 'Tamaño desconocido'}
                          </p>
                        </div>
                        <a
                          href={adjunto.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Ver
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

