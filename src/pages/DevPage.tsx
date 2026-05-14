import { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '../organisms/Navbar';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import Modal from '../molecules/Modal';
import Input from '../atoms/Input';
import Loading from '../atoms/Loading';
import GanttChart from '../components/GanttChart';
import { useAuth } from '../context/AuthContext';
import { Propuesta, TareaProyecto } from '../types';
import { obtenerPropuestas, actualizarPropuesta } from '../services/databaseService';

// Formatter reutilizable (Intl.NumberFormat es costoso de instanciar).
const CURRENCY_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

const formatearMoneda = (valor: number): string => CURRENCY_FORMATTER.format(valor);

type ServicioOption = { value: string; label: string; icon: string };

const SERVICIOS_OPTIONS: ReadonlyArray<ServicioOption> = [
  { value: 'paginas-web', label: 'Páginas Web', icon: '🌐' },
  { value: 'aplicaciones-web', label: 'Aplicaciones Web', icon: '💻' },
  { value: 'chatbot-ia', label: 'Chatbot con IA', icon: '🤖' },
  { value: 'automatizacion', label: 'Automatización', icon: '⚙️' },
  { value: 'analisis-datos', label: 'Análisis de Datos', icon: '📊' },
  { value: 'sap-hana', label: 'Soporte SAP ERP & HANA', icon: '🏭' },
];

// Lookup O(1) por value, precomputado.
const SERVICIOS_INDEX = new Map<string, ServicioOption>(SERVICIOS_OPTIONS.map((s) => [s.value, s]));

const formatearFecha = (fecha?: Date): string => {
  if (!fecha) return 'No definida';
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const INITIAL_TAREA = {
  nombre: '',
  fechaInicio: '',
  fechaFin: '',
  duracion: 0,
  progreso: 0,
  responsable: '',
  descripcion: '',
};

export default function DevPage() {
  const { usuario } = useAuth();
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [propuestaSeleccionada, setPropuestaSeleccionada] = useState<Propuesta | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Formulario de fechas y tareas
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [tareas, setTareas] = useState<TareaProyecto[]>([]);
  const [nuevaTarea, setNuevaTarea] = useState(INITIAL_TAREA);

  useEffect(() => {
    if (!usuario) return;
    let cancelado = false;
    const cargarPropuestas = async () => {
      setIsLoading(true);
      try {
        const todasLasPropuestas = await obtenerPropuestas();
        if (cancelado) return;
        const propuestasAprobadas = todasLasPropuestas.filter(
          (p) => p.estadoAprobacion === 'Aprobada'
        );
        setPropuestas(propuestasAprobadas);
      } catch (error) {
        console.error('Error al cargar propuestas:', error);
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    };
    cargarPropuestas();
    return () => {
      cancelado = true;
    };
  }, [usuario]);

  const handleVerPropuesta = useCallback((propuesta: Propuesta) => {
    setPropuestaSeleccionada(propuesta);
    setFechaInicio(propuesta.fechaInicio ? new Date(propuesta.fechaInicio).toISOString().slice(0, 10) : '');
    setFechaEntrega(propuesta.fechaEntrega ? new Date(propuesta.fechaEntrega).toISOString().slice(0, 10) : '');
    setTareas(propuesta.tareasProyecto || []);
    setIsModalOpen(true);
  }, []);

  const handleEditarProyecto = useCallback((propuesta: Propuesta) => {
    setPropuestaSeleccionada(propuesta);
    setFechaInicio(propuesta.fechaInicio ? new Date(propuesta.fechaInicio).toISOString().slice(0, 10) : '');
    setFechaEntrega(propuesta.fechaEntrega ? new Date(propuesta.fechaEntrega).toISOString().slice(0, 10) : '');
    setTareas(propuesta.tareasProyecto || []);
    setIsEditModalOpen(true);
  }, []);

  const handleAgregarTarea = useCallback(() => {
    if (!nuevaTarea.nombre || !nuevaTarea.fechaInicio || !nuevaTarea.fechaFin) {
      alert('Por favor completa nombre, fecha de inicio y fecha de fin de la tarea.');
      return;
    }

    const fechaInicioTarea = new Date(nuevaTarea.fechaInicio);
    const fechaFinTarea = new Date(nuevaTarea.fechaFin);
    const duracion = Math.ceil((fechaFinTarea.getTime() - fechaInicioTarea.getTime()) / (1000 * 60 * 60 * 24));

    const tarea: TareaProyecto = {
      id: `tarea-${Date.now()}`,
      nombre: nuevaTarea.nombre,
      fechaInicio: nuevaTarea.fechaInicio,
      fechaFin: nuevaTarea.fechaFin,
      duracion: duracion > 0 ? duracion : nuevaTarea.duracion || 1,
      progreso: nuevaTarea.progreso,
      responsable: nuevaTarea.responsable || undefined,
      descripcion: nuevaTarea.descripcion || undefined,
    };

    setTareas((prev) => [...prev, tarea]);
    setNuevaTarea(INITIAL_TAREA);
  }, [nuevaTarea]);

  const handleEliminarTarea = useCallback((tareaId: string) => {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      setTareas((prev) => prev.filter((t) => t.id !== tareaId));
    }
  }, []);

  const handleActualizarProgreso = useCallback((tareaId: string, progreso: number) => {
    setTareas((prev) => prev.map((t) =>
      t.id === tareaId ? { ...t, progreso: Math.max(0, Math.min(100, progreso)) } : t
    ));
  }, []);

  const handleGuardarProyecto = useCallback(async () => {
    if (!propuestaSeleccionada) return;

    if (!fechaInicio || !fechaEntrega) {
      alert('Por favor ingresa la fecha de inicio y fecha de entrega del proyecto.');
      return;
    }

    setIsSaving(true);
    try {
      const propuestaActualizada = await actualizarPropuesta(propuestaSeleccionada.id, {
        fechaInicio: new Date(fechaInicio),
        fechaEntrega: new Date(fechaEntrega),
        tareasProyecto: tareas,
      });

      // Optimista: actualizamos solo la propuesta editada en el estado local en lugar de
      // re-cargar TODAS las propuestas desde la API (evita una request completa y latencia).
      setPropuestas((prev) =>
        prev.map((p) => (p.id === propuestaActualizada.id ? propuestaActualizada : p))
      );

      setIsEditModalOpen(false);
      alert('✅ Proyecto actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      alert('Error al actualizar el proyecto. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  }, [propuestaSeleccionada, fechaInicio, fechaEntrega, tareas]);

  const handleCerrarModalVer = useCallback(() => {
    setIsModalOpen(false);
    setPropuestaSeleccionada(null);
  }, []);

  const handleCerrarModalEditar = useCallback(() => {
    setIsEditModalOpen(false);
    setPropuestaSeleccionada(null);
  }, []);

  // Memo de las propuestas con su servicioInfo precomputado para evitar lookup O(n) por render.
  const propuestasConServicio = useMemo(
    () =>
      propuestas.map((p) => ({
        propuesta: p,
        servicioInfo: SERVICIOS_INDEX.get(p.servicio),
      })),
    [propuestas]
  );

  const isAdmin = usuario?.rol === 'admin';

  // Verificar autenticación: si aún no carga el usuario, mostramos solo el navbar + skeleton inline.
  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-green-100 to-emerald-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Loading text="Verificando sesión..." />
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
              {propuestas.length} {propuestas.length === 1 ? 'Propuesta' : 'Propuestas'} Aprobada{propuestas.length === 1 ? '' : 's'}
            </Badge>
          </div>
        </Card>

        {/* Lista de Propuestas Aprobadas */}
        {isLoading && (
          <Card className="bg-white/85 border border-emerald-100">
            <div className="py-12 flex justify-center">
              <Loading text="Cargando propuestas aprobadas..." />
            </div>
          </Card>
        )}
        {!isLoading && propuestas.length === 0 && (
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
        )}
        {!isLoading && propuestas.length > 0 && (
          <div className="space-y-4">
            {propuestasConServicio.map(({ propuesta, servicioInfo }) => {
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
                          <p><strong>Fecha Inicio:</strong> {formatearFecha(propuesta.fechaInicio)}</p>
                          <p><strong>Fecha Entrega:</strong> {formatearFecha(propuesta.fechaEntrega)}</p>
                        </div>
                        <div>
                          <p><strong>Valor Total:</strong> {formatearMoneda(propuesta.valorTotal)}</p>
                          <p><strong>Descuento:</strong> {propuesta.descuento ? formatearMoneda(propuesta.descuento) : 'N/A'}</p>
                          <p><strong>Valor Final:</strong> {formatearMoneda(propuesta.valorFinal)}</p>
                          <p><strong>Vence:</strong> {formatearFecha(propuesta.fechaVencimiento)}</p>
                        </div>
                      </div>

                      {/* Archivos Adjuntos en la Lista */}
                      {propuesta.adjuntos && propuesta.adjuntos.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-700 mb-2">📎 Archivos Adjuntos:</p>
                          <div className="flex flex-wrap gap-2">
                            {propuesta.adjuntos.map((adjunto, index) => (
                              <a
                                key={adjunto.nombre ? `${adjunto.nombre}-${index}` : `adj-${index}`}
                                href={adjunto.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors border border-emerald-300"
                                title={`Descargar: ${adjunto.nombre}`}
                              >
                                <span>{adjunto.tipo === 'imagen' ? '🖼️' : '📄'}</span>
                                <span className="text-sm font-medium">{adjunto.nombre}</span>
                                <span className="text-xs">⬇️</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Diagrama de Gantt */}
                      {propuesta.tareasProyecto && propuesta.tareasProyecto.length > 0 && (
                        <div className="mt-4">
                          <GanttChart
                            tareas={propuesta.tareasProyecto}
                            fechaInicio={propuesta.fechaInicio}
                            fechaEntrega={propuesta.fechaEntrega}
                          />
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
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarProyecto(propuesta)}
                        >
                          ✏️ Gestionar Proyecto
                        </Button>
                      )}
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
          onClose={handleCerrarModalVer}
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
                  <p className="text-sm font-semibold text-gray-700">Fecha de Inicio:</p>
                  <p className="font-semibold text-emerald-600">
                    {formatearFecha(propuestaSeleccionada.fechaInicio)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Fecha de Entrega:</p>
                  <p className="font-semibold text-emerald-600">
                    {formatearFecha(propuestaSeleccionada.fechaEntrega)}
                  </p>
                </div>
              </div>

              {/* Diagrama de Gantt */}
              {propuestaSeleccionada.tareasProyecto && propuestaSeleccionada.tareasProyecto.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Diagrama de Gantt:</p>
                  <GanttChart
                    tareas={propuestaSeleccionada.tareasProyecto}
                    fechaInicio={propuestaSeleccionada.fechaInicio}
                    fechaEntrega={propuestaSeleccionada.fechaEntrega}
                  />
                </div>
              )}

              {propuestaSeleccionada.especificaciones && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Especificaciones del Servicio:</p>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{propuestaSeleccionada.especificaciones}</p>
                  </div>
                </div>
              )}

              {propuestaSeleccionada.adjuntos && propuestaSeleccionada.adjuntos.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">📎 Archivos Adjuntos ({propuestaSeleccionada.adjuntos.length}):</p>
                  <div className="space-y-2">
                    {propuestaSeleccionada.adjuntos.map((adjunto, index) => (
                      <div key={adjunto.nombre ? `${adjunto.nombre}-${index}` : `adj-modal-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <span className="text-2xl">{adjunto.tipo === 'imagen' ? '🖼️' : '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{adjunto.nombre}</p>
                          <p className="text-sm text-gray-600">
                            {adjunto.tamaño ? `${(adjunto.tamaño / 1024).toFixed(2)} KB` : 'Tamaño desconocido'}
                            {' • '}
                            {adjunto.tipo === 'imagen' ? 'Imagen' : 'Documento'}
                          </p>
                        </div>
                        <a
                          href={adjunto.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center gap-2"
                          title={`Descargar: ${adjunto.nombre}`}
                        >
                          <span>⬇️</span>
                          <span>Descargar</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Modal Gestionar Proyecto */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleCerrarModalEditar}
          title={`Gestionar Proyecto: ${propuestaSeleccionada?.titulo || ''}`}
          size="xl"
        >
          {propuestaSeleccionada && (
            <div className="space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Fechas del Proyecto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-lg">
                <Input
                  label="Fecha de Inicio del Proyecto *"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  fullWidth
                  className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-emerald-900 placeholder:text-emerald-500"
                />
                <Input
                  label="Fecha de Entrega del Proyecto *"
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  fullWidth
                  className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                  textClassName="text-emerald-900 placeholder:text-emerald-500"
                />
              </div>

              {/* Agregar Nueva Tarea */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Agregar Nueva Tarea</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                  <Input
                    label="Nombre de la Tarea *"
                    value={nuevaTarea.nombre}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, nombre: e.target.value })}
                    placeholder="Ej: Diseño de interfaz"
                    fullWidth
                    className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                    textClassName="text-emerald-900 placeholder:text-emerald-500"
                  />
                  <Input
                    label="Responsable (Opcional)"
                    value={nuevaTarea.responsable}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, responsable: e.target.value })}
                    placeholder="Nombre del desarrollador"
                    fullWidth
                    className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                    textClassName="text-emerald-900 placeholder:text-emerald-500"
                  />
                  <Input
                    label="Fecha de Inicio *"
                    type="date"
                    value={nuevaTarea.fechaInicio}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, fechaInicio: e.target.value })}
                    fullWidth
                    className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                    textClassName="text-emerald-900 placeholder:text-emerald-500"
                  />
                  <Input
                    label="Fecha de Fin *"
                    type="date"
                    value={nuevaTarea.fechaFin}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, fechaFin: e.target.value })}
                    fullWidth
                    className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                    textClassName="text-emerald-900 placeholder:text-emerald-500"
                  />
                  <Input
                    label="Progreso (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={nuevaTarea.progreso.toString()}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, progreso: Number.parseInt(e.target.value, 10) || 0 })}
                    fullWidth
                    className="bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                    textClassName="text-emerald-900 placeholder:text-emerald-500"
                  />
                  <div className="flex items-end">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleAgregarTarea}
                    >
                      + Agregar Tarea
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista de Tareas */}
              {tareas.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Tareas del Proyecto ({tareas.length})</h3>
                  <div className="space-y-2">
                    {tareas.map((tarea) => (
                      <div key={tarea.id} className="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{tarea.nombre}</p>
                          <p className="text-sm text-gray-600">
                            {tarea.fechaInicio} - {tarea.fechaFin} ({tarea.duracion} días)
                            {tarea.responsable && ` • ${tarea.responsable}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={tarea.progreso.toString()}
                            onChange={(e) => handleActualizarProgreso(tarea.id, Number.parseInt(e.target.value, 10) || 0)}
                            className="w-20 bg-white border-emerald-300 focus:ring-emerald-600 focus:border-emerald-600"
                            textClassName="text-emerald-900 placeholder:text-emerald-500"
                          />
                          <span className="text-sm text-gray-600">%</span>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleEliminarTarea(tarea.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vista Previa del Diagrama de Gantt */}
              {tareas.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Vista Previa del Diagrama de Gantt</h3>
                  <GanttChart
                    tareas={tareas}
                    fechaInicio={fechaInicio ? new Date(fechaInicio) : undefined}
                    fechaEntrega={fechaEntrega ? new Date(fechaEntrega) : undefined}
                  />
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleCerrarModalEditar}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleGuardarProyecto}
                  disabled={isSaving || !fechaInicio || !fechaEntrega}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Proyecto'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
