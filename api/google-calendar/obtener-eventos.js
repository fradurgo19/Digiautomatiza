// Vercel Serverless Function - Obtener eventos de Google Calendar
import { setCORSHeaders } from '../lib/cors.js';

/**
 * Obtiene eventos de Google Calendar
 * 
 * Requiere variables de entorno:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Email de la cuenta de servicio
 * - GOOGLE_PRIVATE_KEY: Clave privada de la cuenta de servicio
 * - GOOGLE_CALENDAR_ID: ID del calendario (puede ser el email: digiautomatiza1@gmail.com)
 */
export default async function handler(req, res) {
  try {
    setCORSHeaders(req, res);
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Verificar que las credenciales de Google estén configuradas
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'digiautomatiza1@gmail.com';

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      console.error('❌ Credenciales de Google Calendar no configuradas');
      res.status(500).json({ 
        error: 'Google Calendar no está configurado. Configura GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY en Vercel.' 
      });
      return;
    }

    // Parámetros de consulta
    const { fechaInicio, fechaFin, maxResultados = 50 } = req.query;

    // Importar googleapis dinámicamente
    const { google } = await import('googleapis');

    // Configurar autenticación con Service Account
    // Usamos calendar (no readonly) porque ya tenemos permisos de escritura
    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      GOOGLE_PRIVATE_KEY,
      ['https://www.googleapis.com/auth/calendar'],
      null
    );

    const calendar = google.calendar({ version: 'v3', auth });

    // Preparar parámetros de consulta
    const params = {
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: fechaInicio || new Date().toISOString(),
      maxResults: parseInt(maxResultados),
      singleEvents: true,
      orderBy: 'startTime',
    };

    if (fechaFin) {
      params.timeMax = fechaFin;
    }

    console.log('📅 Obteniendo eventos de Google Calendar:', {
      calendario: GOOGLE_CALENDAR_ID,
      fechaInicio: params.timeMin,
      fechaFin: params.timeMax || 'No especificada',
      maxResultados: params.maxResults
    });

    // Obtener eventos del calendario
    const respuesta = await calendar.events.list(params);

    const eventos = respuesta.data.items || [];

    console.log(`✅ Eventos obtenidos: ${eventos.length}`);

    // Formatear eventos para la respuesta
    const eventosFormateados = eventos.map(evento => ({
      id: evento.id,
      titulo: evento.summary || 'Sin título',
      descripcion: evento.description || '',
      fechaInicio: evento.start?.dateTime || evento.start?.date,
      fechaFin: evento.end?.dateTime || evento.end?.date,
      ubicacion: evento.location || '',
      enlaceMeet: evento.hangoutLink || evento.conferenceData?.entryPoints?.[0]?.uri || null,
      enlaceHtml: evento.htmlLink || null,
      creador: evento.creator?.email || '',
      invitados: evento.attendees?.map(a => ({
        email: a.email,
        nombre: a.displayName || a.email,
        respuesta: a.responseStatus || 'needsAction'
      })) || [],
      estado: evento.status || 'confirmed'
    }));

    res.status(200).json({
      success: true,
      eventos: eventosFormateados,
      total: eventosFormateados.length
    });

  } catch (error) {
    console.error('❌ Error al obtener eventos de Google Calendar:', error);
    
    // Manejar errores específicos de Google
    let mensajeError = 'Error al obtener eventos de Google Calendar';
    if (error.response?.data?.error) {
      mensajeError = error.response.data.error.message || mensajeError;
    } else if (error.message) {
      mensajeError = error.message;
    }

    setCORSHeaders(req, res);
    res.status(500).json({ 
      error: mensajeError,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

