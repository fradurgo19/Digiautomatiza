// Vercel Serverless Function - Google Calendar (combinado: crear evento y obtener eventos)
import { setCORSHeaders } from './lib/cors.js';

/**
 * Maneja todas las operaciones de Google Calendar
 * Rutas:
 * - POST /api/google-calendar -> Crear evento
 * - GET /api/google-calendar -> Obtener eventos
 */
export default async function handler(req, res) {
  try {
    setCORSHeaders(req, res);
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
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

    // Importar googleapis dinámicamente
    const { google } = await import('googleapis');

    // Configurar autenticación con Service Account
    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      GOOGLE_PRIVATE_KEY,
      ['https://www.googleapis.com/auth/calendar'],
      null
    );

    const calendar = google.calendar({ version: 'v3', auth });

    // POST: Crear evento
    if (req.method === 'POST') {
      const { 
        titulo, 
        descripcion, 
        fechaInicio, 
        fechaFin, 
        emailCliente,
        nombreCliente 
      } = req.body;

      if (!titulo || !fechaInicio || !fechaFin) {
        res.status(400).json({ error: 'Faltan campos requeridos: titulo, fechaInicio, fechaFin' });
        return;
      }

      // Preparar el evento con Google Meet
      const evento = {
        summary: titulo,
        description: descripcion || `Sesión con ${nombreCliente || 'cliente'}`,
        start: {
          dateTime: fechaInicio,
          timeZone: 'America/Bogota',
        },
        end: {
          dateTime: fechaFin,
          timeZone: 'America/Bogota',
        },
        // Habilitar Google Meet en el evento
        // Usamos solo el requestId - Google determinará automáticamente el tipo de conferencia
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`
          }
        },
        // NOTA: Las Service Accounts no pueden invitar attendees sin Domain-Wide Delegation
        // Por lo tanto, no agregamos attendees. El cliente puede unirse usando el enlace de Google Meet
        // La información del cliente ya está incluida en la descripción del evento
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 15 }
          ]
        }
      };

      console.log('📅 Creando evento en Google Calendar:', {
        calendario: GOOGLE_CALENDAR_ID,
        titulo,
        fechaInicio,
        fechaFin
      });

      // Crear el evento en el calendario
      const respuesta = await calendar.events.insert({
        calendarId: GOOGLE_CALENDAR_ID,
        conferenceDataVersion: 1,
        requestBody: evento,
      });

      const eventoCreado = respuesta.data;
      const meetLink = eventoCreado.hangoutLink || eventoCreado.conferenceData?.entryPoints?.[0]?.uri;

      console.log('✅ Evento creado en Google Calendar:', {
        id: eventoCreado.id,
        meetLink: meetLink || 'No disponible'
      });

      res.status(200).json({
        success: true,
        eventoId: eventoCreado.id,
        meetLink: meetLink,
        htmlLink: eventoCreado.htmlLink,
        fechaCreacion: eventoCreado.created
      });

    // GET: Obtener eventos
    } else if (req.method === 'GET') {
      const { fechaInicio, fechaFin, maxResultados = 50 } = req.query;

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

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ Error en Google Calendar:', error);
    
    // Manejar errores específicos de Google
    let mensajeError = 'Error en Google Calendar';
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

