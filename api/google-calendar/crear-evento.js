// Vercel Serverless Function - Crear evento en Google Calendar con Google Meet
import { setCORSHeaders } from '../lib/cors.js';

/**
 * Crea un evento en Google Calendar con enlace de Google Meet
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

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

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

    // Importar googleapis dinámicamente (solo cuando se necesite)
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

    // Preparar el evento con Google Meet
    const evento = {
      summary: titulo,
      description: descripcion || `Sesión con ${nombreCliente || 'cliente'}`,
      start: {
        dateTime: fechaInicio,
        timeZone: 'America/Bogota', // Zona horaria de Colombia
      },
      end: {
        dateTime: fechaFin,
        timeZone: 'America/Bogota',
      },
      // Habilitar Google Meet en el evento
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      // NOTA: Las Service Accounts no pueden invitar attendees sin Domain-Wide Delegation
      // Por lo tanto, no agregamos attendees. El cliente puede unirse usando el enlace de Google Meet
      // La información del cliente ya está incluida en la descripción del evento
      // Configuración adicional
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // Recordatorio 1 día antes
          { method: 'popup', minutes: 15 } // Recordatorio 15 minutos antes
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
      conferenceDataVersion: 1, // Importante: permite crear Google Meet
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

  } catch (error) {
    console.error('❌ Error al crear evento en Google Calendar:', error);
    
    // Manejar errores específicos de Google
    let mensajeError = 'Error al crear evento en Google Calendar';
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

