import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Formulario de fechas y tareas
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [tareas, setTareas] = useState<TareaProyecto[]>([]);
  const [nuevaTarea, setNuevaTarea] = useState({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    duracion: 0,
    progreso: 0,
    responsable: '',
    descripcion: '',
  });

  // Verificar si el usuario es administrador
  useEffect(() => {
    if (usuario && usuario.rol !== 'admin') {
      navigate('/dashboard');
    }
  }, [usuario, navigate]);

  useEffect(() => {
    const cargarPropuestas = async () => {
      setIsLoading(true);
      try {
        const todasLasPropuestas = await obtenerPropuestas();
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
    setFechaInicio(propuesta.fechaInicio ? new Date(propuesta.fechaInicio).toISOString().slice(0, 10) : '');
    setFechaEntrega(propuesta.fechaEntrega ? new Date(propuesta.fechaEntrega).toISOString().slice(0, 10) : '');
    setTareas(propuesta.tareasProyecto || []);
    setIsModalOpen(true);
  };

  const handleEditarProyecto = (propuesta: Propuesta) => {
    setPropuestaSeleccionada(propuesta);
    setFechaInicio(propuesta.fechaInicio ? new Date(propuesta.fechaInicio).toISOString().slice(0, 10) : '');
    setFechaEntrega(propuesta.fechaEntrega ? new Date(propuesta.fechaEntrega).toISOString().slice(0, 10) : '');
    setTareas(propuesta.tareasProyecto || []);
    setIsEditModalOpen(true);
  };

  const handleAgregarTarea = () => {
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

    setTareas([...tareas, tarea]);
    setNuevaTarea({
      nombre: '',
      fechaInicio: '',
      fechaFin: '',
      duracion: 0,
      progreso: 0,
      responsable: '',
      descripcion: '',
    });
  };

  const handleEliminarTarea = (tareaId: string) => {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      setTareas(tareas.filter(t => t.id !== tareaId));
    }
  };

  const handleActualizarProgreso = (tareaId: string, progreso: number) => {
    setTareas(tareas.map(t => 
      t.id === tareaId ? { ...t, progreso: Math.max(0, Math.min(100, progreso)) } : t
    ));
  };

  const handleGuardarProyecto = async () => {
    if (!propuestaSeleccionada) return;

    if (!fechaInicio || !fechaEntrega) {
      alert('Por favor ingresa la fecha de inicio y fecha de entrega del proyecto.');
      return;
    }

    setIsSaving(true);
    try {
      await actualizarPropuesta(propuestaSeleccionada.id, {
        fechaInicio: new Date(fechaInicio),
        fechaEntrega: new Date(fechaEntrega),
        tareasProyecto: tareas,
      });

      // Recargar propuestas
      const todasLasPropuestas = await obtenerPropuestas();
      const propuestasAprobadas = todasLasPropuestas.filter(
        p => p.estadoAprobacion === 'Aprobada'
      );
      setPropuestas(propuestasAprobadas);

      setIsEditModalOpen(false);
      alert('✅ Proyecto actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      alert('Error al actualizar el proyecto. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatearFecha = (fecha?: Date): string => {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditarProyecto(propuesta)}
                      >
                        ✏️ Gestionar Proyecto
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
                  <p className="text-sm font-semibold text-gray-700">Fecha de Inicio:</p>
                  <p className="text-gray-900 font-semibold text-emerald-600">
                    {formatearFecha(propuestaSeleccionada.fechaInicio)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Fecha de Entrega:</p>
                  <p className="text-gray-900 font-semibold text-emerald-600">
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
            </div>
          )}
        </Modal>

        {/* Modal Gestionar Proyecto */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setPropuestaSeleccionada(null);
          }}
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
                  className="bg-white"
                />
                <Input
                  label="Fecha de Entrega del Proyecto *"
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  fullWidth
                  className="bg-white"
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
                    className="bg-white"
                  />
                  <Input
                    label="Responsable (Opcional)"
                    value={nuevaTarea.responsable}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, responsable: e.target.value })}
                    placeholder="Nombre del desarrollador"
                    fullWidth
                    className="bg-white"
                  />
                  <Input
                    label="Fecha de Inicio *"
                    type="date"
                    value={nuevaTarea.fechaInicio}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, fechaInicio: e.target.value })}
                    fullWidth
                    className="bg-white"
                  />
                  <Input
                    label="Fecha de Fin *"
                    type="date"
                    value={nuevaTarea.fechaFin}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, fechaFin: e.target.value })}
                    fullWidth
                    className="bg-white"
                  />
                  <Input
                    label="Progreso (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={nuevaTarea.progreso.toString()}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, progreso: parseInt(e.target.value) || 0 })}
                    fullWidth
                    className="bg-white"
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
                            onChange={(e) => handleActualizarProgreso(tarea.id, parseInt(e.target.value) || 0)}
                            className="w-20 bg-white"
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
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setPropuestaSeleccionada(null);
                  }}
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
