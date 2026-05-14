import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { esEnlaceGoogleMeetValido } from '../services/googleMeetService';

function formatearFechaSesion(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const año = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${dia}/${mes}/${año}`;
}

function obtenerValorFechaParaInput(fecha: Date | string | null | undefined): string {
  if (!fecha) return '';
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return d.toISOString().split('T')[0];
}

export default function SesionesPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSavingSesion, setIsSavingSesion] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sesionEditando, setSesionEditando] = useState<Sesion | null>(null);
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
  const [crearEnCalendario, setCrearEnCalendario] = useState(true);

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
      const [clientesRes, sesionesData] = await Promise.all([
        obtenerClientes(),
        obtenerSesiones(),
      ]);
      setClientes(clientesRes.data);
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
      // Validar formato del enlace si se proporcionó uno manualmente
      if (nuevaSesion.urlReunion && !esEnlaceGoogleMeetValido(nuevaSesion.urlReunion)) {
        alert('El enlace de Google Meet debe tener el formato: https://meet.google.com/xxx-yyyy-zzz\n\nEjemplo: https://meet.google.com/abc-defg-hij');
        setIsSavingSesion(false);
        return;
      }
      
      // NO generar enlace automáticamente - solo usar el que viene de Google Calendar o el ingresado manualmente
      // Los enlaces aleatorios no funcionan porque no son reuniones reales creadas
      const urlReunion = nuevaSesion.urlReunion || undefined;
      
      const payload = {
        clienteId: nuevaSesion.clienteId,
        fecha: new Date(nuevaSesion.fecha),
        hora: nuevaSesion.hora,
        servicio: nuevaSesion.servicio,
        estado: nuevaSesion.estado,
        notas: nuevaSesion.notas || undefined,
        urlReunion: urlReunion,
        crearEnCalendario: crearEnCalendario,
      };
      const nueva = await crearSesionApi(payload);
      
      // Si se creó el evento en Calendar y se generó un enlace, mostrar mensaje
      if (crearEnCalendario && nueva.urlReunion) {
        alert(`✅ Sesión creada exitosamente!\n\n📅 Evento creado en Google Calendar\n🎥 Enlace de Google Meet: ${nueva.urlReunion}`);
      }
      
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
      
      // Notificar a otros módulos (como CalendarioPage) que se eliminó una sesión
      globalThis.dispatchEvent(new Event('sesionEliminada'));
      // También actualizar localStorage para trigger storage event
      localStorage.setItem('sesiones_updated', Date.now().toString());
    } catch (error) {
      console.error('Error al eliminar sesión:', error);
      alert('No se pudo eliminar la sesión. Intenta nuevamente.');
    }
  };

  const handleEditarSesion = (sesion: Sesion) => {
    setSesionEditando(sesion);
    setIsEditModalOpen(true);
  };

  const handleGuardarEdicion = async () => {
    if (!sesionEditando) return;

    if (!sesionEditando.fecha || !sesionEditando.hora || !sesionEditando.servicio) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsSavingSesion(true);
    try {
      const payload = {
        fecha: new Date(sesionEditando.fecha),
        hora: sesionEditando.hora,
        servicio: sesionEditando.servicio,
        estado: sesionEditando.estado,
        notas: sesionEditando.notas || undefined,
        urlReunion: sesionEditando.urlReunion || undefined,
      };
      
      const actualizada = await actualizarSesionApi(sesionEditando.id, payload);
      setSesiones(prev => prev.map(s => (s.id === sesionEditando.id ? actualizada : s)));
      
      // Notificar a otros módulos (como CalendarioPage) que se actualizó una sesión
      globalThis.dispatchEvent(new Event('sesionActualizada'));
      localStorage.setItem('sesiones_updated', Date.now().toString());
      
      setIsEditModalOpen(false);
      setSesionEditando(null);
    } catch (error) {
      console.error('Error al actualizar sesión:', error);
      alert('No se pudo actualizar la sesión. Intenta nuevamente.');
    } finally {
      setIsSavingSesion(false);
    }
  };

  const sesionesOrdenadas = useMemo(() => {
    const filtradas = filtroEstado === 'todas'
      ? sesiones
      : sesiones.filter(s => s.estado === filtroEstado);
    return [...filtradas].sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return dateB - dateA; // Más recientes primero
    });
  }, [sesiones, filtroEstado]);

  const conteoPorEstado = useMemo(() => {
    const counts = new Map<EstadoSesion, number>();
    for (const sesion of sesiones) {
      counts.set(sesion.estado, (counts.get(sesion.estado) ?? 0) + 1);
    }
    return counts;
  }, [sesiones]);

  const mensajeListaVacia =
    filtroEstado === 'todas'
      ? 'Programa tu primera sesión con un cliente'
      : `No hay sesiones con estado "${estadoOptions.find(e => e.value === filtroEstado)?.label}"`;

  const renderListContent = () => {
    if (isLoading) {
      return (
        <div className="py-24 flex justify-center">
          <Loading text="Cargando sesiones..." />
        </div>
      );
    }
    if (fetchError) {
      return (
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
      );
    }
    if (sesionesOrdenadas.length === 0) {
      return (
        <Card className="bg-white/80 border border-emerald-100 shadow-md shadow-emerald-100/40">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-emerald-900 mb-2">
              No hay sesiones programadas
            </h3>
            <p className="text-gray-600 mb-4">{mensajeListaVacia}</p>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              + Programar Sesión
            </Button>
          </div>
        </Card>
      );
    }
    return (
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
                    <p><strong>📅 Fecha:</strong> {formatearFechaSesion(sesion.fecha)}</p>
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
                  textClassName="text-green-600"
                  className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                />
                <Button variant="primary" size="sm" onClick={() => handleEditarSesion(sesion)}>
                  ✏️ Editar
                </Button>
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
    );
  };

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
            const count = conteoPorEstado.get(estado.value as EstadoSesion) ?? 0;
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
        {renderListContent()}

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
                  className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="!text-gray-900"
                  labelClassName="text-emerald-800"
                />
                
                <Input
                  label="Fecha *"
                  type="date"
                  value={nuevaSesion.fecha}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, fecha: e.target.value })}
                  fullWidth
                  className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-gray-900 placeholder:text-emerald-500"
                  labelClassName="text-emerald-800"
                />
                
                <Input
                  label="Hora *"
                  type="time"
                  value={nuevaSesion.hora}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, hora: e.target.value })}
                  fullWidth
                  className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-gray-900 placeholder:text-emerald-500"
                  labelClassName="text-emerald-800"
                />
                
                <Select
                  label="Servicio *"
                  options={serviciosOptions}
                  value={nuevaSesion.servicio}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, servicio: e.target.value as ServicioTipo })}
                  fullWidth
                  placeholder="Selecciona un servicio"
                  className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="!text-gray-900"
                  labelClassName="text-emerald-800"
                />
                
                <Select
                  label="Estado"
                  options={estadoOptions}
                  value={nuevaSesion.estado}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, estado: e.target.value as EstadoSesion })}
                  fullWidth
                  className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="!text-gray-900"
                  labelClassName="text-emerald-800"
                />
                
                <div>
                  <label htmlFor="nueva-sesion-url-reunion" className="block text-sm font-medium text-emerald-800 mb-2">
                    URL de la reunión (opcional)
                  </label>
                  <Input
                    id="nueva-sesion-url-reunion"
                    type="url"
                    value={nuevaSesion.urlReunion}
                    onChange={(e) => setNuevaSesion({ ...nuevaSesion, urlReunion: e.target.value })}
                    fullWidth
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                    textClassName="text-gray-900 placeholder:text-emerald-500"
                  />
                  <p className="text-xs text-emerald-700 mt-1">
                    💡 Si marcas "Crear evento en Google Calendar", se generará automáticamente un enlace válido de Google Meet.
                  </p>
                  {nuevaSesion.urlReunion && (
                    <p className="text-xs text-blue-700 mt-1">
                      ℹ️ Asegúrate de que el enlace sea válido. Puedes crearlo desde <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="underline">meet.google.com</a>
                    </p>
                  )}
                </div>

                {/* Opción para crear en Google Calendar */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer" htmlFor="crear-evento-calendario">
                    <input
                      id="crear-evento-calendario"
                      type="checkbox"
                      checked={crearEnCalendario}
                      onChange={(e) => setCrearEnCalendario(e.target.checked)}
                      disabled={isSavingSesion}
                      className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                      aria-label="Crear evento en Google Calendar"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-blue-900">
                        📅 Crear evento en Google Calendar
                      </span>
                      <span className="text-xs text-blue-800 mt-1 block">
                        Se creará automáticamente un evento en el calendario de digiautomatiza1@gmail.com con enlace de Google Meet
                      </span>
                    </div>
                  </label>
                </div>
                
                <TextArea
                  label="Notas"
                  value={nuevaSesion.notas}
                  onChange={(e) => setNuevaSesion({ ...nuevaSesion, notas: e.target.value })}
                  fullWidth
                  rows={4}
                  placeholder="Información adicional sobre la sesión..."
                  className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-gray-900 placeholder:text-emerald-500"
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

        {/* Modal Editar Sesión */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSesionEditando(null);
          }}
          title="Editar Sesión"
          size="lg"
        >
          {sesionEditando && (
            <div className="space-y-4 rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-white border border-emerald-200 p-6 shadow-lg shadow-emerald-100/60">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Cliente:</strong> {sesionEditando.cliente.nombre} ({sesionEditando.cliente.email})
                </p>
              </div>

              <Input
                label="Fecha *"
                type="date"
                value={obtenerValorFechaParaInput(sesionEditando.fecha)}
                onChange={(e) => {
                  const nuevaFecha = new Date(e.target.value);
                  setSesionEditando({ ...sesionEditando, fecha: nuevaFecha });
                }}
                fullWidth
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="text-gray-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
              
              <Input
                label="Hora *"
                type="time"
                value={sesionEditando.hora}
                onChange={(e) => setSesionEditando({ ...sesionEditando, hora: e.target.value })}
                fullWidth
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="text-gray-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
              
              <Select
                label="Servicio *"
                options={serviciosOptions}
                value={sesionEditando.servicio}
                onChange={(e) => setSesionEditando({ ...sesionEditando, servicio: e.target.value as ServicioTipo })}
                fullWidth
                placeholder="Selecciona un servicio"
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="!text-gray-900"
                labelClassName="text-emerald-800"
              />
              
              <Select
                label="Estado"
                options={estadoOptions}
                value={sesionEditando.estado}
                onChange={(e) => setSesionEditando({ ...sesionEditando, estado: e.target.value as EstadoSesion })}
                fullWidth
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="!text-gray-900"
                labelClassName="text-emerald-800"
              />
              
              <div>
                <label htmlFor="editar-sesion-url-reunion" className="block text-sm font-medium text-emerald-800 mb-2">
                  URL de la reunión (opcional)
                </label>
                <Input
                  id="editar-sesion-url-reunion"
                  type="url"
                  value={sesionEditando.urlReunion || ''}
                  onChange={(e) => setSesionEditando({ ...sesionEditando, urlReunion: e.target.value })}
                  fullWidth
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-gray-900 placeholder:text-emerald-500"
                />
                <p className="text-xs text-emerald-700 mt-1">
                  💡 Puedes actualizar el enlace de Google Meet si es necesario.
                </p>
              </div>
              
              <TextArea
                label="Notas"
                value={sesionEditando.notas || ''}
                onChange={(e) => setSesionEditando({ ...sesionEditando, notas: e.target.value })}
                fullWidth
                rows={4}
                placeholder="Información adicional sobre la sesión..."
                className="bg-white/90 border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                textClassName="text-gray-900 placeholder:text-emerald-500"
                labelClassName="text-emerald-800"
              />
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSesionEditando(null);
                  }}
                  disabled={isSavingSesion}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleGuardarEdicion}
                  disabled={!sesionEditando.fecha || !sesionEditando.hora || !sesionEditando.servicio || isSavingSesion}
                >
                  {isSavingSesion ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

