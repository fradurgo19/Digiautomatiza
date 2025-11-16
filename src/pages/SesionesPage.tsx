import { useState, useEffect, useCallback } from 'react';
import Navbar from '../organisms/Navbar';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import TextArea from '../atoms/TextArea';
import Modal from '../molecules/Modal';
import Badge from '../atoms/Badge';
import { Sesion, Cliente, ServicioTipo, EstadoSesion } from '../types';
import Loading from '../atoms/Loading';
import {
  obtenerClientes,
  obtenerSesiones,
  crearSesion as crearSesionApi,
  actualizarSesion as actualizarSesionApi,
  eliminarSesion as eliminarSesionApi,
} from '../services/databaseService';

export default function SesionesPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSavingSesion, setIsSavingSesion] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<EstadoSesion | 'todas'>('todas');

  const [nuevaSesion, setNuevaSesion] = useState({
    clienteId: '',
    fecha: '',
    hora: '',
    servicio: '' as ServicioTipo,
    estado: 'programada' as EstadoSesion,
    notas: '',
    urlReunion: '',
  });

  const serviciosOptions = [
    { value: 'paginas-web', label: 'Páginas Web' },
    { value: 'aplicaciones-web', label: 'Aplicaciones Web' },
    { value: 'chatbot-ia', label: 'Chatbot con IA' },
    { value: 'automatizacion', label: 'Automatización' },
    { value: 'analisis-datos', label: 'Análisis de Datos' },
  ];

  const estadoOptions = [
    { value: 'programada', label: 'Programada' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'reprogramada', label: 'Reprogramada' },
  ];

  const estadoColors = {
    'programada': 'info',
    'confirmada': 'primary',
    'completada': 'success',
    'cancelada': 'danger',
    'reprogramada': 'warning',
  } as const;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [clientesData, sesionesData] = await Promise.all([
        obtenerClientes(),
        obtenerSesiones(),
      ]);
      setClientes(clientesData);
      setSesiones(sesionesData);
    } catch (error) {
      console.error('Error al cargar sesiones/clientes:', error);
      setFetchError('No se pudieron cargar las sesiones. Verifica la conexión con el backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSesion = async () => {
    if (!nuevaSesion.clienteId || !nuevaSesion.fecha || !nuevaSesion.hora || !nuevaSesion.servicio) {
      alert('Los campos con * son obligatorios');
      return;
    }

    const cliente = clientes.find(c => c.id === nuevaSesion.clienteId);
    if (!cliente) {
      alert('Por favor selecciona un cliente válido');
      return;
    }

    setIsSavingSesion(true);
    try {
      const payload = {
        clienteId: nuevaSesion.clienteId,
        fecha: new Date(nuevaSesion.fecha),
        hora: nuevaSesion.hora,
        servicio: nuevaSesion.servicio,
        estado: nuevaSesion.estado,
        notas: nuevaSesion.notas || undefined,
        urlReunion: nuevaSesion.urlReunion || undefined,
      };
      const nueva = await crearSesionApi(payload);
      setSesiones(prev => [nueva, ...prev]);
      setIsAddModalOpen(false);
      setNuevaSesion({
        clienteId: '',
        fecha: '',
        hora: '',
        servicio: '' as ServicioTipo,
        estado: 'programada',
        notas: '',
        urlReunion: '',
      });
    } catch (error) {
      console.error('Error al programar sesión:', error);
      alert('No se pudo programar la sesión. Intenta nuevamente.');
    } finally {
      setIsSavingSesion(false);
    }
  };

  const handleCambiarEstado = async (sesionId: string, nuevoEstado: EstadoSesion) => {
    try {
      const actualizada = await actualizarSesionApi(sesionId, { estado: nuevoEstado });
      setSesiones(prev => prev.map(s => (s.id === sesionId ? actualizada : s)));
    } catch (error) {
      console.error('Error al actualizar estado de sesión:', error);
      alert('No se pudo actualizar el estado de la sesión.');
    }
  };

  const handleEliminarSesion = async (sesionId: string) => {
    if (!confirm('¿Está seguro de eliminar esta sesión?')) return;
    try {
      await eliminarSesionApi(sesionId);
      setSesiones(prev => prev.filter(s => s.id !== sesionId));
    } catch (error) {
      console.error('Error al eliminar sesión:', error);
      alert('No se pudo eliminar la sesión. Intenta nuevamente.');
    }
  };

  const sesionesFiltradas = filtroEstado === 'todas'
    ? sesiones
    : sesiones.filter(s => s.estado === filtroEstado);

  const sesionesOrdenadas = [...sesionesFiltradas].sort((a, b) => {
    const dateA = new Date(a.fecha).getTime();
    const dateB = new Date(b.fecha).getTime();
    return dateB - dateA; // Más recientes primero
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-100 via-green-100 to-emerald-50 text-gray-900 overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(16,94,67,0.08) 1px, transparent 0)',
          backgroundSize: '70px 70px',
        }}
      />
      <div className="absolute -top-32 -right-16 w-96 h-96 bg-emerald-400/30 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-lime-300/30 blur-3xl rounded-full pointer-events-none" />

      <Navbar />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-emerald-700 via-lime-600 to-emerald-500 bg-clip-text text-transparent">
                Programación de Sesiones
              </span>
            </h1>
            <p className="text-gray-700 mt-2">
              Total: {sesiones.length} sesiones programadas
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            + Programar Sesión
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6 bg-white/80 border border-emerald-100 shadow-md shadow-emerald-100/40">
          <div className="flex gap-4 items-center">
            <span className="font-semibold text-emerald-800">Filtrar por estado:</span>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filtroEstado === 'todas' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('todas')}
              >
                Todas
              </Button>
              {estadoOptions.map(option => (
                <Button
                  key={option.value}
                  variant={filtroEstado === option.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroEstado(option.value as EstadoSesion)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {estadoOptions.map(estado => {
            const count = sesiones.filter(s => s.estado === estado.value).length;
            return (
              <Card key={estado.value} className="bg-white/80 border border-emerald-100 text-center shadow-md shadow-emerald-100/50">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-800">{count}</p>
                  <p className="text-sm text-gray-600">{estado.label}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Lista de sesiones */}
        {isLoading ? (
          <div className="py-24 flex justify-center">
            <Loading text="Cargando sesiones..." />
          </div>
        ) : fetchError ? (
          <Card className="bg-white/80 border border-emerald-100 shadow-md shadow-emerald-100/40">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-red-700">No se pudieron cargar las sesiones</h3>
                <p className="text-sm text-red-600">{fetchError}</p>
              </div>
              <Button variant="primary" onClick={fetchData}>
                Reintentar
              </Button>
            </div>
          </Card>
        ) : sesionesOrdenadas.length === 0 ? (
          <Card className="bg-white/80 border border-emerald-100 shadow-md shadow-emerald-100/40">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-emerald-900 mb-2">
                No hay sesiones programadas
              </h3>
              <p className="text-gray-600 mb-4">
                {filtroEstado === 'todas'
                  ? 'Programa tu primera sesión con un cliente'
                  : `No hay sesiones con estado "${estadoOptions.find(e => e.value === filtroEstado)?.label}"`}
              </p>
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                + Programar Sesión
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {sesionesOrdenadas.map((sesion) => (
              <Card key={sesion.id} className="bg-white/85 border border-emerald-100 shadow-lg shadow-emerald-100/50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        {sesion.cliente.nombre}
                      </h3>
                      <Badge variant={estadoColors[sesion.estado]}>
                        {estadoOptions.find(e => e.value === sesion.estado)?.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                      <div>
                        <p><strong>📧 Email:</strong> {sesion.cliente.email}</p>
                        <p><strong>📱 Teléfono:</strong> {sesion.cliente.telefono}</p>
                      </div>
                      <div>
                        <p><strong>📅 Fecha:</strong> {new Date(sesion.fecha).toLocaleDateString('es-ES')}</p>
                        <p><strong>⏰ Hora:</strong> {sesion.hora}</p>
                        <p><strong>💼 Servicio:</strong> {serviciosOptions.find(s => s.value === sesion.servicio)?.label}</p>
                      </div>
                    </div>

                    {sesion.urlReunion && (
                      <div className="mt-2">
                        <a
                          href={sesion.urlReunion}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline text-sm"
                        >
                          🔗 {sesion.urlReunion}
                        </a>
                      </div>
                    )}

                    {sesion.notas && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="font-semibold text-sm">Notas:</p>
                        <p className="text-gray-600 text-sm mt-1">{sesion.notas}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Select
                      options={estadoOptions}
                      value={sesion.estado}
                      onChange={(e) => handleCambiarEstado(sesion.id, e.target.value as EstadoSesion)}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleEliminarSesion(sesion.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Programar Sesión */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Programar Nueva Sesión"
          size="lg"
        >
          <div className="space-y-4 rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-white border border-emerald-200 p-6 shadow-lg shadow-emerald-100/60">
            {clientes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  <strong>Aviso:</strong> No hay clientes registrados. Por favor, agrega clientes primero en la sección de Gestión de Clientes.
                </p>
              </div>
            ) : (
              <>
                <Select
                  label="Cliente *"
                  options={clientes.map(c => ({ value: c.id, label: `${c.nombre} - ${c.email}` }))}
                  value={nuevaSesion.clienteId}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, clienteId: e.target.value })}
                  fullWidth
                  placeholder="Selecciona un cliente"
                  className="bg-emerald-200 border-emerald-400 focus:ring-emerald-700 focus:border-emerald-700"
                  textClassName="text-emerald-950"
                  labelClassName="text-emerald-800"
                />
                
                <Input
                  label="Fecha *"
                  type="date"
                  value={nuevaSesion.fecha}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, fecha: e.target.value })}
                  fullWidth
                  className="bg-emerald-50/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-emerald-900 placeholder:text-emerald-500"
                  labelClassName="text-emerald-800"
                />
                
                <Input
                  label="Hora *"
                  type="time"
                  value={nuevaSesion.hora}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, hora: e.target.value })}
                  fullWidth
                  className="bg-emerald-50/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-emerald-900 placeholder:text-emerald-500"
                  labelClassName="text-emerald-800"
                />
                
                <Select
                  label="Servicio *"
                  options={serviciosOptions}
                  value={nuevaSesion.servicio}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, servicio: e.target.value as ServicioTipo })}
                  fullWidth
                  placeholder="Selecciona un servicio"
                  className="bg-emerald-200 border-emerald-400 focus:ring-emerald-700 focus:border-emerald-700"
                  textClassName="text-emerald-950"
                  labelClassName="text-emerald-800"
                />
                
                <Select
                  label="Estado"
                  options={estadoOptions}
                  value={nuevaSesion.estado}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, estado: e.target.value as EstadoSesion })}
                  fullWidth
                  className="bg-emerald-200 border-emerald-400 focus:ring-emerald-700 focus:border-emerald-700"
                  textClassName="text-emerald-950"
                  labelClassName="text-emerald-800"
                />
                
                <Input
                  label="URL de la reunión (opcional)"
                  type="url"
                  value={nuevaSesion.urlReunion}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, urlReunion: e.target.value })}
                  fullWidth
                  placeholder="https://meet.google.com/..."
                  className="bg-emerald-50/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-emerald-900 placeholder:text-emerald-500"
                  labelClassName="text-emerald-800"
                />
                
                <TextArea
                  label="Notas"
                  value={nuevaSesion.notas}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, notas: e.target.value })}
                  fullWidth
                  rows={4}
                  placeholder="Información adicional sobre la sesión..."
                  className="bg-emerald-50/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-emerald-900 placeholder:text-emerald-500"
                  labelClassName="text-emerald-800"
                />
                
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleAddSesion}
                  disabled={!nuevaSesion.clienteId || !nuevaSesion.fecha || !nuevaSesion.hora || !nuevaSesion.servicio || isSavingSesion}
                >
                  {isSavingSesion ? 'Guardando...' : 'Programar Sesión'}
                </Button>
              </>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}

