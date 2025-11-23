/**
 * Servicio para interactuar con Google Calendar API
 */

const API_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.MODE === 'production' || import.meta.env.PROD
    ? 'https://www.digiautomatiza.co' 
    : 'http://localhost:3000');

export interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  ubicacion?: string;
  enlaceMeet?: string | null;
  enlaceHtml?: string | null;
  creador: string;
  invitados: Array<{
    email: string;
    nombre: string;
    respuesta: string;
  }>;
  estado: string;
}

export interface RespuestaEventos {
  success: boolean;
  eventos: EventoCalendario[];
  total: number;
}

/**
 * Obtiene eventos de Google Calendar
 * @param fechaInicio - Fecha de inicio en formato ISO (opcional, por defecto: hoy)
 * @param fechaFin - Fecha de fin en formato ISO (opcional)
 * @param maxResultados - Número máximo de resultados (por defecto: 50)
 */
export async function obtenerEventosCalendario(
  fechaInicio?: string,
  fechaFin?: string,
  maxResultados: number = 50
): Promise<RespuestaEventos> {
  try {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    params.append('maxResultados', maxResultados.toString());

    const response = await fetch(`${API_URL}/api/google-calendar/obtener-eventos?${params.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || 'Error al obtener eventos del calendario');
    }

    const data: RespuestaEventos = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener eventos del calendario:', error);
    throw error;
  }
}

