import { useState, useEffect, useMemo } from 'react';
import Navbar from '../organisms/Navbar';
import Card from '../atoms/Card';
import Loading from '../atoms/Loading';
import Button from '../atoms/Button';
import Modal from '../molecules/Modal';
import { obtenerEventosCalendario, EventoCalendario } from '../services/googleCalendarService';

type VistaCalendario = 'mes' | 'semana' | 'dia';

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<VistaCalendario>('mes');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoCalendario | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    cargarEventos();
  }, [fechaActual, vista]);

  // Escuchar cambios en sesiones para refrescar eventos
  useEffect(() => {
    const handleSesionChange = () => {
      // Recargar eventos cuando se detecta un cambio en sesiones
      cargarEventos();
    };

    // Escuchar eventos de storage (cuando se actualiza una sesión desde otra pestaña)
    window.addEventListener('storage', handleSesionChange);
    
    // Escuchar eventos personalizados (cuando se actualiza una sesión en la misma pestaña)
    window.addEventListener('sesionActualizada', handleSesionChange);
    window.addEventListener('sesionEliminada', handleSesionChange);

    // También recargar periódicamente cada 30 segundos para asegurar sincronización
    const interval = setInterval(() => {
      cargarEventos();
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleSesionChange);
      window.removeEventListener('sesionActualizada', handleSesionChange);
      window.removeEventListener('sesionEliminada', handleSesionChange);
      clearInterval(interval);
    };
  }, [fechaActual, vista]); // Incluir dependencias para que cargarEventos tenga acceso a las variables actuales

  const cargarEventos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let fechaInicio: string | undefined;
      let fechaFin: string | undefined;

      const inicio = new Date(fechaActual);
      inicio.setHours(0, 0, 0, 0);

      switch (vista) {
        case 'dia':
          fechaInicio = inicio.toISOString();
          const finDia = new Date(inicio);
          finDia.setHours(23, 59, 59, 999);
          fechaFin = finDia.toISOString();
          break;
        case 'semana':
          // Obtener el inicio de la semana (lunes)
          const inicioSemana = new Date(inicio);
          const diaSemana = inicioSemana.getDay();
          const diff = inicioSemana.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
          inicioSemana.setDate(diff);
          fechaInicio = inicioSemana.toISOString();
          
          const finSemana = new Date(inicioSemana);
          finSemana.setDate(finSemana.getDate() + 6);
          finSemana.setHours(23, 59, 59, 999);
          fechaFin = finSemana.toISOString();
          break;
        case 'mes':
          // Primer día del mes
          const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
          fechaInicio = inicioMes.toISOString();
          
          // Último día del mes
          const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
          finMes.setHours(23, 59, 59, 999);
          fechaFin = finMes.toISOString();
          break;
      }

      const respuesta = await obtenerEventosCalendario(fechaInicio, fechaFin, 200);
      setEventos(respuesta.eventos);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
      const mensajeError = err instanceof Error ? err.message : 'Error al cargar eventos del calendario';
      setError(mensajeError);
    } finally {
      setIsLoading(false);
    }
  };

  const formatearFecha = (fechaISO: string): string => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearHora = (fechaISO: string): string => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearFechaCorta = (fecha: Date): string => {
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  };

  const obtenerDiasDelMes = () => {
    const year = fechaActual.getFullYear();
    const month = fechaActual.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const inicioSemana = primerDia.getDay();
    const inicioSemanaAjustado = inicioSemana === 0 ? 6 : inicioSemana - 1; // Lunes = 0

    const dias: (Date | null)[] = [];
    
    // Días del mes anterior
    for (let i = inicioSemanaAjustado - 1; i >= 0; i--) {
      const fecha = new Date(year, month, -i);
      dias.push(fecha);
    }
    
    // Días del mes actual
    for (let i = 1; i <= diasEnMes; i++) {
      dias.push(new Date(year, month, i));
    }
    
    // Completar hasta 42 días (6 semanas)
    while (dias.length < 42) {
      const siguienteMes = new Date(year, month + 1, dias.length - diasEnMes - inicioSemanaAjustado + 1);
      dias.push(siguienteMes);
    }

    return dias;
  };

  const obtenerDiasSemana = () => {
    const inicioSemana = new Date(fechaActual);
    const diaSemana = inicioSemana.getDay();
    const diff = inicioSemana.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    inicioSemana.setDate(diff);
    
    const dias: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      dias.push(fecha);
    }
    return dias;
  };

  const obtenerEventosDelDia = (fecha: Date): EventoCalendario[] => {
    const fechaStr = fecha.toDateString();
    return eventos.filter(evento => {
      const fechaEvento = new Date(evento.fechaInicio);
      return fechaEvento.toDateString() === fechaStr;
    });
  };

  const esHoy = (fecha: Date): boolean => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const esMismoMes = (fecha: Date): boolean => {
    return fecha.getMonth() === fechaActual.getMonth() && 
           fecha.getFullYear() === fechaActual.getFullYear();
  };

  const navegarMes = (direccion: number) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setFechaActual(nuevaFecha);
  };

  const navegarSemana = (direccion: number) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() + (direccion * 7));
    setFechaActual(nuevaFecha);
  };

  const navegarDia = (direccion: number) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() + direccion);
    setFechaActual(nuevaFecha);
  };

  const irAHoy = () => {
    setFechaActual(new Date());
  };

  const handleClickEvento = (evento: EventoCalendario) => {
    setEventoSeleccionado(evento);
    setIsModalOpen(true);
  };

  const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const nombresDiasCompletos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
              <h1 className="text-3xl font-bold text-gray-800 mb-2">📅 Calendario de Google</h1>
              <p className="text-gray-600">
                Eventos del calendario de digiautomatiza1@gmail.com
              </p>
            </div>
            
            {/* Controles de navegación y vista */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-2">
                <Button
                  variant={vista === 'mes' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setVista('mes')}
                >
                  Mes
                </Button>
                <Button
                  variant={vista === 'semana' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setVista('semana')}
                >
                  Semana
                </Button>
                <Button
                  variant={vista === 'dia' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setVista('dia')}
                >
                  Día
                </Button>
              </div>
              
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (vista === 'mes') navegarMes(-1);
                    else if (vista === 'semana') navegarSemana(-1);
                    else navegarDia(-1);
                  }}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={irAHoy}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (vista === 'mes') navegarMes(1);
                    else if (vista === 'semana') navegarSemana(1);
                    else navegarDia(1);
                  }}
                >
                  →
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Error */}
        {error && (
          <Card className="bg-red-50 border-red-200 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800">Error al cargar eventos</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Calendario */}
        {vista === 'mes' && (
          <Card className="bg-white/85 border border-emerald-100 shadow-lg">
            <div className="p-4">
              <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
                {formatearFechaCorta(fechaActual)}
              </h2>
              
              {/* Encabezados de días */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {nombresDias.map((dia) => (
                  <div key={dia} className="text-center font-semibold text-gray-700 py-2">
                    {dia}
                  </div>
                ))}
              </div>
              
              {/* Días del calendario */}
              <div className="grid grid-cols-7 gap-1">
                {obtenerDiasDelMes().map((fecha, index) => {
                  if (!fecha) return <div key={index} className="min-h-[100px]"></div>;
                  
                  const eventosDia = obtenerEventosDelDia(fecha);
                  const esDiaActual = esHoy(fecha);
                  const esDelMes = esMismoMes(fecha);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] border border-gray-200 p-1 ${
                        esDiaActual ? 'bg-blue-50 border-blue-300' : ''
                      } ${!esDelMes ? 'bg-gray-50 text-gray-400' : ''}`}
                    >
                      <div className={`text-sm font-semibold mb-1 ${esDiaActual ? 'text-blue-700' : ''}`}>
                        {fecha.getDate()}
                      </div>
                      <div className="space-y-1">
                        {eventosDia.slice(0, 3).map((evento) => (
                          <div
                            key={evento.id}
                            onClick={() => handleClickEvento(evento)}
                            className="text-xs bg-emerald-500 text-white p-1 rounded cursor-pointer hover:bg-emerald-600 truncate"
                            title={evento.titulo}
                          >
                            {formatearHora(evento.fechaInicio)} {evento.titulo}
                          </div>
                        ))}
                        {eventosDia.length > 3 && (
                          <div className="text-xs text-emerald-700 font-semibold">
                            +{eventosDia.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {vista === 'semana' && (
          <Card className="bg-white/85 border border-emerald-100 shadow-lg">
            <div className="p-4">
              <h2 className="text-xl font-bold text-center mb-4 text-gray-800">
                Semana del {obtenerDiasSemana()[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} al {obtenerDiasSemana()[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              
              <div className="grid grid-cols-7 gap-2">
                {obtenerDiasSemana().map((fecha, index) => {
                  const eventosDia = obtenerEventosDelDia(fecha);
                  const esDiaActual = esHoy(fecha);
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-2">
                      <div className={`text-center font-semibold mb-2 ${esDiaActual ? 'text-blue-700' : 'text-gray-700'}`}>
                        <div className="text-sm">{nombresDiasCompletos[index]}</div>
                        <div className={`text-lg ${esDiaActual ? 'bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                          {fecha.getDate()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {eventosDia.map((evento) => (
                          <div
                            key={evento.id}
                            onClick={() => handleClickEvento(evento)}
                            className="text-xs bg-emerald-500 text-white p-2 rounded cursor-pointer hover:bg-emerald-600"
                          >
                            <div className="font-semibold">{formatearHora(evento.fechaInicio)}</div>
                            <div className="truncate">{evento.titulo}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {vista === 'dia' && (
          <Card className="bg-white/85 border border-emerald-100 shadow-lg">
            <div className="p-4">
              <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
                {fechaActual.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
              
              <div className="space-y-3">
                {obtenerEventosDelDia(fechaActual).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl block mb-2">📅</span>
                    <p>No hay eventos programados para este día</p>
                  </div>
                ) : (
                  obtenerEventosDelDia(fechaActual).map((evento) => (
                    <div
                      key={evento.id}
                      onClick={() => handleClickEvento(evento)}
                      className="border border-emerald-200 rounded-lg p-4 bg-emerald-50 hover:bg-emerald-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-lg text-gray-800 mb-1">
                            {formatearHora(evento.fechaInicio)} - {formatearHora(evento.fechaFin)}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{evento.titulo}</h3>
                          {evento.descripcion && (
                            <p className="text-sm text-gray-600 mb-2">{evento.descripcion}</p>
                          )}
                        </div>
                        {evento.enlaceMeet && (
                          <a
                            href={evento.enlaceMeet}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            🎥 Meet
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Modal de detalles del evento */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEventoSeleccionado(null);
          }}
          title="Detalles del Evento"
          size="lg"
        >
          {eventoSeleccionado && (
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{eventoSeleccionado.titulo}</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">📅</span>
                  <span className="font-medium">{formatearFecha(eventoSeleccionado.fechaInicio)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">⏰</span>
                  <span>
                    {formatearHora(eventoSeleccionado.fechaInicio)} - {formatearHora(eventoSeleccionado.fechaFin)}
                  </span>
                </div>

                {eventoSeleccionado.descripcion && (
                  <div>
                    <p className="font-semibold mb-1">Descripción:</p>
                    <p className="text-gray-600 whitespace-pre-line">{eventoSeleccionado.descripcion}</p>
                  </div>
                )}

                {eventoSeleccionado.ubicacion && (
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">📍</span>
                    <span>{eventoSeleccionado.ubicacion}</span>
                  </div>
                )}

                {eventoSeleccionado.enlaceMeet && (
                  <div>
                    <a
                      href={eventoSeleccionado.enlaceMeet}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span>🎥</span>
                      <span>Unirse a Google Meet</span>
                    </a>
                  </div>
                )}

                {eventoSeleccionado.enlaceHtml && (
                  <div>
                    <a
                      href={eventoSeleccionado.enlaceHtml}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Ver en Google Calendar →
                    </a>
                  </div>
                )}

                {eventoSeleccionado.invitados.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">Invitados:</p>
                    <div className="flex flex-wrap gap-2">
                      {eventoSeleccionado.invitados.map((invitado, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs"
                        >
                          <span>👤</span>
                          <span>{invitado.nombre}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
