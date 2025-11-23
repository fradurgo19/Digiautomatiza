import { useState, useEffect } from 'react';
import Navbar from '../organisms/Navbar';
import Card from '../atoms/Card';
import Loading from '../atoms/Loading';
import Button from '../atoms/Button';
import { obtenerEventosCalendario, EventoCalendario } from '../services/googleCalendarService';

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangoFechas, setRangoFechas] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('semana');

  useEffect(() => {
    cargarEventos();
  }, [rangoFechas]);

  const cargarEventos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let fechaInicio: string | undefined;
      let fechaFin: string | undefined;

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      switch (rangoFechas) {
        case 'hoy':
          fechaInicio = hoy.toISOString();
          const finHoy = new Date(hoy);
          finHoy.setHours(23, 59, 59, 999);
          fechaFin = finHoy.toISOString();
          break;
        case 'semana':
          fechaInicio = hoy.toISOString();
          const finSemana = new Date(hoy);
          finSemana.setDate(finSemana.getDate() + 7);
          fechaFin = finSemana.toISOString();
          break;
        case 'mes':
          fechaInicio = hoy.toISOString();
          const finMes = new Date(hoy);
          finMes.setMonth(finMes.getMonth() + 1);
          fechaFin = finMes.toISOString();
          break;
        case 'todos':
          // No especificar fechas para obtener todos los eventos futuros
          break;
      }

      const respuesta = await obtenerEventosCalendario(fechaInicio, fechaFin, 100);
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
            
            {/* Filtros de fecha */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={rangoFechas === 'hoy' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setRangoFechas('hoy')}
              >
                Hoy
              </Button>
              <Button
                variant={rangoFechas === 'semana' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setRangoFechas('semana')}
              >
                Esta Semana
              </Button>
              <Button
                variant={rangoFechas === 'mes' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setRangoFechas('mes')}
              >
                Este Mes
              </Button>
              <Button
                variant={rangoFechas === 'todos' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setRangoFechas('todos')}
              >
                Todos
              </Button>
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
                <p className="text-xs text-red-500 mt-1">
                  Verifica que Google Calendar esté configurado correctamente en Vercel.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de eventos */}
        {eventos.length === 0 && !error ? (
          <Card className="bg-white/85 border border-emerald-100">
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📅</span>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No hay eventos programados
              </h3>
              <p className="text-gray-600">
                {rangoFechas === 'hoy' 
                  ? 'No hay eventos para hoy'
                  : rangoFechas === 'semana'
                  ? 'No hay eventos esta semana'
                  : rangoFechas === 'mes'
                  ? 'No hay eventos este mes'
                  : 'No hay eventos futuros'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {eventos.map((evento) => (
              <Card
                key={evento.id}
                className="bg-white/85 border border-emerald-100 shadow-lg shadow-emerald-100/50 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Información principal */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-xl font-bold text-gray-800 flex-1">
                        {evento.titulo}
                      </h3>
                      {evento.enlaceHtml && (
                        <a
                          href={evento.enlaceHtml}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver en Google Calendar →
                        </a>
                      )}
                    </div>

                    {/* Fecha y hora */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600">📅</span>
                        <span className="font-medium">{formatearFecha(evento.fechaInicio)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600">⏰</span>
                        <span>
                          {formatearHora(evento.fechaInicio)} - {formatearHora(evento.fechaFin)}
                        </span>
                      </div>
                    </div>

                    {/* Descripción */}
                    {evento.descripcion && (
                      <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">
                        {evento.descripcion}
                      </p>
                    )}

                    {/* Ubicación */}
                    {evento.ubicacion && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                        <span className="text-emerald-600">📍</span>
                        <span>{evento.ubicacion}</span>
                      </div>
                    )}

                    {/* Enlace de Google Meet */}
                    {evento.enlaceMeet && (
                      <div className="mb-3">
                        <a
                          href={evento.enlaceMeet}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <span>🎥</span>
                          <span>Unirse a Google Meet</span>
                        </a>
                      </div>
                    )}

                    {/* Invitados */}
                    {evento.invitados.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Invitados:</p>
                        <div className="flex flex-wrap gap-2">
                          {evento.invitados.map((invitado, index) => (
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
              </Card>
            ))}
          </div>
        )}

        {/* Información adicional */}
        {eventos.length > 0 && (
          <Card className="bg-blue-50 border-blue-200 mt-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Total de eventos: {eventos.length}</p>
                <p className="text-xs">
                  Los eventos se sincronizan automáticamente desde Google Calendar. 
                  Para crear nuevos eventos, programa una sesión desde la página de Sesiones.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

