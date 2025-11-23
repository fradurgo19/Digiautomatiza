// Vercel Serverless Function - Gestión de Sesiones (GET, POST)
import prisma from './lib/prisma.js';
import { setCORSHeaders } from './lib/cors.js';

export default async function handler(req, res) {
  try {
    const allowedOrigin = setCORSHeaders(req, res);
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
    console.log(`🔍 [${req.method}] /api/sesiones - Origin: ${origin}, Allowed: ${allowedOrigin}`);

    if (req.method === 'OPTIONS') {
      console.log('✅ OPTIONS preflight recibido');
      res.status(200).end();
      return;
    }
  } catch (corsError) {
    console.error('Error al establecer CORS:', corsError);
    setCORSHeaders(req, res);
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  }
  
  try {
    // Verificar si hay un ID en el query (para delete/update)
    const { id, action } = req.query;
    
    if (id && (action === 'delete' || action === 'update')) {
      // Manejar acciones sobre una sesión específica
      const body = req.body || {};
      const usuarioId = body.usuarioId || req.headers['x-usuario-id'] || null;

      console.log(`🔍 Acción sobre sesión ${id}: ${action}`);

      if (action === 'delete') {
        console.log(`🗑️ Eliminando sesión ${id} - UsuarioId: ${usuarioId}`);
        
        // Obtener la sesión antes de eliminarla para verificar si tiene eventoId
        const sesionAEliminar = await prisma.sesion.findUnique({
          where: { id }
        });
        
        // Si la sesión tiene un eventoId, eliminar el evento en Google Calendar
        if (sesionAEliminar?.eventoId) {
          try {
            const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
            const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'digiautomatiza1@gmail.com';
            
            if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
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

              console.log('🗑️ Eliminando evento en Google Calendar...');
              await calendar.events.delete({
                calendarId: GOOGLE_CALENDAR_ID,
                eventId: sesionAEliminar.eventoId
              });
              
              console.log('✅ Evento eliminado en Google Calendar:', sesionAEliminar.eventoId);
            }
          } catch (calendarError) {
            console.error('⚠️ Error al eliminar evento en Google Calendar (sesión eliminada):', calendarError);
            // No fallar la eliminación de la sesión si falla el calendario
          }
        }
        
        // Eliminar la sesión de la base de datos
        await prisma.sesion.delete({ where: { id } });
        console.log(`✅ Sesión eliminada exitosamente: ${id}`);
        res.status(200).json({ success: true });
        return;
      } else if (action === 'update') {
        // Update
        const datos = { ...body };
        delete datos.action;
        delete datos.usuarioId;
        delete datos.rol;

        if (datos.fecha) {
          datos.fecha = new Date(datos.fecha);
        }

        console.log(`🔄 Actualizando sesión ${id} - UsuarioId: ${usuarioId}`, datos);
        
        // Obtener la sesión actual para verificar si tiene eventoId
        const sesionActual = await prisma.sesion.findUnique({
          where: { id },
          include: { cliente: true }
        });
        
        // Actualizar la sesión en la base de datos
        const sesion = await prisma.sesion.update({
          where: { id },
          data: datos,
          include: { cliente: true },
        });
        
        // Si la sesión tiene un eventoId, actualizar el evento en Google Calendar
        if (sesionActual?.eventoId) {
          try {
            const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
            const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'digiautomatiza1@gmail.com';
            
            if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
              const { google } = await import('googleapis');
              
              // Preparar fechas para el evento
              const fechaSesion = new Date(sesion.fecha);
              const [horas, minutos] = sesion.hora.split(':');
              fechaSesion.setHours(parseInt(horas), parseInt(minutos), 0, 0);
              
              // Duración de 1 hora por defecto
              const fechaFin = new Date(fechaSesion);
              fechaFin.setHours(fechaFin.getHours() + 1);
              
              // Nombres de servicios
              const nombresServicios = {
                'paginas-web': 'Páginas Web',
                'aplicaciones-web': 'Aplicaciones Web',
                'chatbot-ia': 'Chatbot con IA',
                'automatizacion': 'Automatización',
                'analisis-datos': 'Análisis de Datos',
                'sap-hana': 'Soporte SAP ERP & HANA'
              };
              
              const nombreServicio = nombresServicios[sesion.servicio] || sesion.servicio;
              const titulo = `Sesión: ${nombreServicio} - ${sesion.cliente?.nombre || 'Cliente'}`;
              const descripcion = `Sesión programada con ${sesion.cliente?.nombre || 'cliente'}\n\n` +
                `Servicio: ${nombreServicio}\n` +
                `Cliente: ${sesion.cliente?.nombre || 'N/A'}\n` +
                `Email: ${sesion.cliente?.email || 'N/A'}\n` +
                `Teléfono: ${sesion.cliente?.telefono || 'N/A'}\n` +
                (sesion.notas ? `\nNotas: ${sesion.notas}` : '');
              
              // Configurar autenticación con Service Account
              const auth = new google.auth.JWT(
                GOOGLE_SERVICE_ACCOUNT_EMAIL,
                null,
                GOOGLE_PRIVATE_KEY,
                ['https://www.googleapis.com/auth/calendar'],
                null
              );

              const calendar = google.calendar({ version: 'v3', auth });

              // Obtener el evento existente para preservar el enlace de Meet
              let eventoExistente;
              try {
                eventoExistente = await calendar.events.get({
                  calendarId: GOOGLE_CALENDAR_ID,
                  eventId: sesionActual.eventoId
                });
              } catch (error) {
                console.warn('⚠️ No se pudo obtener el evento existente, se creará uno nuevo:', error.message);
              }

              // Preparar el evento actualizado
              const eventoActualizado = {
                summary: titulo,
                description: descripcion,
                start: {
                  dateTime: fechaSesion.toISOString(),
                  timeZone: 'America/Bogota',
                },
                end: {
                  dateTime: fechaFin.toISOString(),
                  timeZone: 'America/Bogota',
                },
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 15 }
                  ]
                }
              };

              // Preservar el enlace de Meet si existe
              if (eventoExistente?.data?.conferenceData) {
                eventoActualizado.conferenceData = eventoExistente.data.conferenceData;
              } else if (sesion.urlReunion) {
                // Si hay un enlace de reunión pero no está en el evento, intentar agregarlo
                eventoActualizado.conferenceData = {
                  createRequest: {
                    requestId: `meet-${sesion.id}-${Date.now()}`
                  }
                };
              }

              console.log('📅 Actualizando evento en Google Calendar...');
              await calendar.events.update({
                calendarId: GOOGLE_CALENDAR_ID,
                eventId: sesionActual.eventoId,
                requestBody: eventoActualizado,
              });
              
              console.log('✅ Evento actualizado en Google Calendar:', sesionActual.eventoId);
            }
          } catch (calendarError) {
            console.error('⚠️ Error al actualizar evento en Google Calendar (sesión actualizada):', calendarError);
            // No fallar la actualización de la sesión si falla el calendario
          }
        }
        
        console.log(`✅ Sesión actualizada exitosamente: ${sesion.id}`);
        res.status(200).json({ sesion });
        return;
      }
    }

    if (req.method === 'GET') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const rol = req.headers['x-usuario-rol'] ?? null;
      const isAdmin = rol && String(rol).toLowerCase() === 'admin';

      let where = undefined;
      if (usuarioId && !isAdmin) {
        where = { usuarioId: String(usuarioId) };
      }

      console.log('📋 Obteniendo sesiones - Admin:', isAdmin, 'UsuarioId:', usuarioId);

      const sesiones = await prisma.sesion.findMany({
        ...(where && { where }),
        include: { cliente: true },
        orderBy: { fecha: 'desc' },
      });
      
      console.log(`✅ Sesiones obtenidas: ${sesiones.length}`);
      
      res.status(200).json({ sesiones });
    } else if (req.method === 'POST') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const { clienteId, fecha, hora, servicio, estado, notas, urlReunion, crearEnCalendario } = req.body;
      
      console.log('➕ Creando sesión - UsuarioId:', usuarioId, 'ClienteId:', clienteId);
      
      // Obtener datos del cliente para el evento de calendario
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId }
      });
      
      const sesion = await prisma.sesion.create({
        data: {
          clienteId,
          fecha: new Date(fecha),
          hora,
          servicio,
          estado: estado || 'programada',
          notas,
          urlReunion,
          usuarioId: usuarioId ? String(usuarioId) : null,
        },
        include: { cliente: true },
      });
      
      console.log('✅ Sesión creada exitosamente:', sesion.id);
      
      // Crear evento en Google Calendar si está habilitado y las credenciales están configuradas
      let meetLinkFromCalendar = null;
      if (crearEnCalendario !== false) {
        try {
          const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
          const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
          const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'digiautomatiza1@gmail.com';
          
          if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
            // Importar googleapis dinámicamente
            const { google } = await import('googleapis');
            
            // Preparar fechas para el evento
            const fechaSesion = new Date(fecha);
            const [horas, minutos] = hora.split(':');
            fechaSesion.setHours(parseInt(horas), parseInt(minutos), 0, 0);
            
            // Duración de 1 hora por defecto
            const fechaFin = new Date(fechaSesion);
            fechaFin.setHours(fechaFin.getHours() + 1);
            
            // Nombres de servicios
            const nombresServicios = {
              'paginas-web': 'Páginas Web',
              'aplicaciones-web': 'Aplicaciones Web',
              'chatbot-ia': 'Chatbot con IA',
              'automatizacion': 'Automatización',
              'analisis-datos': 'Análisis de Datos',
              'sap-hana': 'Soporte SAP ERP & HANA'
            };
            
            const nombreServicio = nombresServicios[servicio] || servicio;
            const titulo = `Sesión: ${nombreServicio} - ${cliente?.nombre || 'Cliente'}`;
            const descripcion = `Sesión programada con ${cliente?.nombre || 'cliente'}\n\n` +
              `Servicio: ${nombreServicio}\n` +
              `Cliente: ${cliente?.nombre || 'N/A'}\n` +
              `Email: ${cliente?.email || 'N/A'}\n` +
              `Teléfono: ${cliente?.telefono || 'N/A'}\n` +
              (notas ? `\nNotas: ${notas}` : '');
            
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
            // NOTA: Las Service Accounts no pueden invitar attendees sin Domain-Wide Delegation
            // Por lo tanto, no agregamos attendees, pero incluimos la info del cliente en la descripción
            const evento = {
              summary: titulo,
              description: descripcion,
              start: {
                dateTime: fechaSesion.toISOString(),
                timeZone: 'America/Bogota',
              },
              end: {
                dateTime: fechaFin.toISOString(),
                timeZone: 'America/Bogota',
              },
              // Habilitar Google Meet en el evento
              // Usamos solo el requestId - Google determinará automáticamente el tipo de conferencia
              conferenceData: {
                createRequest: {
                  requestId: `meet-${sesion.id}-${Date.now()}`
                }
              },
              // NO agregamos attendees porque las Service Accounts no pueden hacerlo sin Domain-Wide Delegation
              // El cliente puede unirse usando el enlace de Google Meet que se generará
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'email', minutes: 24 * 60 },
                  { method: 'popup', minutes: 15 }
                ]
              }
            };

            console.log('📅 Creando evento en Google Calendar...');
            const calendarResponse = await calendar.events.insert({
              calendarId: GOOGLE_CALENDAR_ID,
              conferenceDataVersion: 1,
              requestBody: evento,
            });

            const eventoCreado = calendarResponse.data;
            meetLinkFromCalendar = eventoCreado.hangoutLink || eventoCreado.conferenceData?.entryPoints?.[0]?.uri;

            console.log('✅ Evento creado en Google Calendar:', {
              eventoId: eventoCreado.id,
              meetLink: meetLinkFromCalendar || 'No disponible'
            });
            
            // Actualizar la sesión con el eventoId y el enlace de Meet si se generó
            const datosActualizacion = {
              eventoId: eventoCreado.id
            };
            if (meetLinkFromCalendar && !urlReunion) {
              datosActualizacion.urlReunion = meetLinkFromCalendar;
            }
            
            const sesionActualizada = await prisma.sesion.update({
              where: { id: sesion.id },
              data: datosActualizacion,
              include: { cliente: true }
            });
            
            if (meetLinkFromCalendar && !urlReunion) {
              console.log('✅ Enlace de Google Meet agregado desde calendario:', meetLinkFromCalendar);
            }
            console.log('✅ EventoId guardado en sesión:', eventoCreado.id);
            
            res.status(201).json({ 
              sesion: sesionActualizada, 
              eventoCalendario: {
                eventoId: eventoCreado.id,
                meetLink: meetLinkFromCalendar,
                htmlLink: eventoCreado.htmlLink
              }
            });
            return;
          } else {
            console.log('ℹ️ Google Calendar no configurado, saltando creación de evento');
          }
        } catch (calendarError) {
          console.error('⚠️ Error al crear evento en Google Calendar (sesión guardada):', calendarError);
          // No fallar la creación de la sesión si falla el calendario
        }
      }
      
      res.status(201).json({ sesion });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Error en /api/sesiones:', error.message);
    
    try {
      setCORSHeaders(req, res);
    } catch (corsError) {
      console.error('Error al establecer CORS en catch:', corsError);
    }
    res.setHeader('Content-Type', 'application/json');
    
    let statusCode = 500;
    let errorMessage = error.message || 'Error interno del servidor';
    
    if (error.name === 'PrismaClientInitializationError' || error.message.includes("Can't reach database")) {
      statusCode = 500;
      errorMessage = 'Error de conexión a la base de datos';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      type: error.constructor.name
    });
  }
}

