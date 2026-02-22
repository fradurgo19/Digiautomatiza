// Vercel Serverless Function - Gestión de Sesiones (GET, POST)
import prisma from './lib/prisma.mjs';
import { setCORSHeaders } from './lib/cors.mjs';

async function handleDeleteSession(sessionId, res) {
  console.log(`🗑️ Eliminando sesión ${sessionId}`);
  const sesionAEliminar = await prisma.sesion.findUnique({ where: { id: sessionId } });
  if (sesionAEliminar?.eventoId) {
    try {
      const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replaceAll(String.raw`\n`, '\n');
      const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'digiautomatiza1@gmail.com';
      if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
        const { google } = await import('googleapis');
        const auth = new google.auth.JWT(
          GOOGLE_SERVICE_ACCOUNT_EMAIL,
          null,
          GOOGLE_PRIVATE_KEY,
          ['https://www.googleapis.com/auth/calendar'],
          null
        );
        const calendar = google.calendar({ version: 'v3', auth });
        await calendar.events.delete({
          calendarId: GOOGLE_CALENDAR_ID,
          eventId: sesionAEliminar.eventoId
        });
        console.log('✅ Evento eliminado en Google Calendar:', sesionAEliminar.eventoId);
      }
    } catch (calendarError) {
      console.error('⚠️ Error al eliminar evento en Google Calendar (sesión eliminada):', calendarError);
    }
  }
  await prisma.sesion.delete({ where: { id: sessionId } });
  console.log(`✅ Sesión eliminada exitosamente: ${sessionId}`);
  res.status(200).json({ success: true });
}

const NOMBRES_SERVICIOS = {
  'paginas-web': 'Páginas Web',
  'aplicaciones-web': 'Aplicaciones Web',
  'chatbot-ia': 'Chatbot con IA',
  'automatizacion': 'Automatización',
  'analisis-datos': 'Análisis de Datos',
  'sap-hana': 'Soporte SAP ERP & HANA'
};

/** Actualiza en Google Calendar el evento asociado a la sesión (busca por eventoId o por título). */
async function syncCalendarEventWithSesion(sessionId, sesionActual, sesion) {
  const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replaceAll(String.raw`\n`, '\n');
  const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'digiautomatiza1@gmail.com';
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.log('⚠️ Google Calendar no configurado, saltando actualización de evento');
    return;
  }
  const { google } = await import('googleapis');
  const auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    GOOGLE_PRIVATE_KEY,
    ['https://www.googleapis.com/auth/calendar'],
    null
  );
  const calendar = google.calendar({ version: 'v3', auth });
  let eventoIdParaActualizar = sesionActual?.eventoId;
  if (!eventoIdParaActualizar) {
    const fechaSesionOriginal = new Date(sesionActual.fecha);
    const [horasOriginal, minutosOriginal] = sesionActual.hora.split(':');
    fechaSesionOriginal.setHours(Number.parseInt(horasOriginal, 10), Number.parseInt(minutosOriginal, 10), 0, 0);
    const fechaInicioBusqueda = new Date(fechaSesionOriginal);
    fechaInicioBusqueda.setHours(0, 0, 0, 0);
    const fechaFinBusqueda = new Date(fechaSesionOriginal);
    fechaFinBusqueda.setHours(23, 59, 59, 999);
    const nombreServicio = NOMBRES_SERVICIOS[sesionActual.servicio] || sesionActual.servicio;
    const tituloBusqueda = `Sesión: ${nombreServicio} - ${sesionActual.cliente?.nombre || 'Cliente'}`;
    const eventosEncontrados = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: fechaInicioBusqueda.toISOString(),
      timeMax: fechaFinBusqueda.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const eventoEncontrado = eventosEncontrados.data.items?.find(e => e.summary === tituloBusqueda);
    if (eventoEncontrado) {
      eventoIdParaActualizar = eventoEncontrado.id;
      console.log(`✅ Evento encontrado en Google Calendar: ${eventoIdParaActualizar}`);
      await prisma.sesion.update({
        where: { id: sessionId },
        data: { eventoId: eventoIdParaActualizar }
      });
    } else {
      console.log('⚠️ No se encontró evento en Google Calendar para esta sesión');
      return;
    }
  }
  const fechaDate = new Date(sesion.fecha);
  const [horas, minutos] = sesion.hora.split(':');
  const fechaStr = fechaDate.toISOString().split('T')[0];
  const fechaSesionISO = `${fechaStr}T${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}:00-05:00`;
  const fechaFinDate = new Date(fechaSesionISO);
  fechaFinDate.setHours(fechaFinDate.getHours() + 1);
  const fechaFinISO = fechaFinDate.toISOString().replaceAll('Z', '-05:00');
  const nombreServicio = NOMBRES_SERVICIOS[sesion.servicio] || sesion.servicio;
  const titulo = `Sesión: ${nombreServicio} - ${sesion.cliente?.nombre || 'Cliente'}`;
  const descripcion = `Sesión programada con ${sesion.cliente?.nombre || 'cliente'}\n\n` +
    `Servicio: ${nombreServicio}\n` +
    `Cliente: ${sesion.cliente?.nombre || 'N/A'}\n` +
    `Email: ${sesion.cliente?.email || 'N/A'}\n` +
    `Teléfono: ${sesion.cliente?.telefono || 'N/A'}\n` +
    (sesion.notas ? `\nNotas: ${sesion.notas}` : '');
  let eventoExistente;
  try {
    eventoExistente = await calendar.events.get({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: eventoIdParaActualizar
    });
  } catch (error) {
    console.warn('⚠️ No se pudo obtener el evento existente:', error.message);
  }
  const eventoActualizado = {
    summary: titulo,
    description: descripcion,
    start: { dateTime: fechaSesionISO, timeZone: 'America/Bogota' },
    end: { dateTime: fechaFinISO, timeZone: 'America/Bogota' },
    reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 24 * 60 }, { method: 'popup', minutes: 15 }] }
  };
  if (eventoExistente?.data?.conferenceData) {
    eventoActualizado.conferenceData = eventoExistente.data.conferenceData;
  } else if (sesion.urlReunion) {
    eventoActualizado.conferenceData = { createRequest: { requestId: `meet-${sesion.id}-${Date.now()}` } };
  }
  await calendar.events.update({
    calendarId: GOOGLE_CALENDAR_ID,
    eventId: eventoIdParaActualizar,
    requestBody: eventoActualizado,
  });
  console.log('✅ Evento actualizado exitosamente en Google Calendar:', eventoIdParaActualizar);
}

async function handleUpdateSession(sessionId, body, usuarioId, res) {
  const datos = { ...body };
  delete datos.action;
  delete datos.usuarioId;
  delete datos.rol;
  if (datos.fecha) datos.fecha = new Date(datos.fecha);
  console.log(`🔄 Actualizando sesión ${sessionId} - UsuarioId: ${usuarioId}`, datos);
  const sesionActual = await prisma.sesion.findUnique({
    where: { id: sessionId },
    include: { cliente: true }
  });
  console.log(`📋 Sesión actual - eventoId: ${sesionActual?.eventoId || 'NO TIENE'}`);
  const sesion = await prisma.sesion.update({
    where: { id: sessionId },
    data: datos,
    include: { cliente: true },
  });
  try {
    await syncCalendarEventWithSesion(sessionId, sesionActual, sesion);
  } catch (calendarError) {
    console.error('⚠️ Error al actualizar evento en Google Calendar (sesión actualizada):', calendarError);
  }
  console.log(`✅ Sesión actualizada exitosamente: ${sesion.id}`);
  res.status(200).json({ sesion });
}

async function handleGetSesiones(req, res) {
  const usuarioId = req.headers['x-usuario-id'] ?? null;
  const rol = req.headers['x-usuario-rol'] ?? null;
  const isAdmin = rol && String(rol).toLowerCase() === 'admin';
  let where;
  if (usuarioId && !isAdmin) {
    where = { usuarioId: String(usuarioId) };
  }
  console.log('📋 Obteniendo sesiones - Admin:', isAdmin, 'UsuarioId:', usuarioId);
  const sesiones = await prisma.sesion.findMany({
    ...(where !== undefined && { where }),
    include: { cliente: true },
    orderBy: { fecha: 'desc' },
  });
  console.log(`✅ Sesiones obtenidas: ${sesiones.length}`);
  res.status(200).json({ sesiones });
}

/** Crea evento en Google Calendar para una sesión. Retorna { eventoCreado, meetLink } o null. */
async function tryCreateCalendarEventForSesion(sesion, cliente, fecha, hora, servicio, notas, urlReunion) {
  const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replaceAll(String.raw`\n`, '\n');
  const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'digiautomatiza1@gmail.com';
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.log('ℹ️ Google Calendar no configurado, saltando creación de evento');
    return null;
  }
  const { google } = await import('googleapis');
  const auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    GOOGLE_PRIVATE_KEY,
    ['https://www.googleapis.com/auth/calendar'],
    null
  );
  const calendar = google.calendar({ version: 'v3', auth });
  const fechaDate = new Date(fecha);
  const [horas, minutos] = hora.split(':');
  const fechaStr = fechaDate.toISOString().split('T')[0];
  const fechaSesionISO = `${fechaStr}T${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}:00-05:00`;
  const fechaFinDate = new Date(fechaSesionISO);
  fechaFinDate.setHours(fechaFinDate.getHours() + 1);
  const fechaFinISO = fechaFinDate.toISOString().replaceAll('Z', '-05:00');
  const nombreServicio = NOMBRES_SERVICIOS[servicio] || servicio;
  const titulo = `Sesión: ${nombreServicio} - ${cliente?.nombre || 'Cliente'}`;
  const descripcion = `Sesión programada con ${cliente?.nombre || 'cliente'}\n\n` +
    `Servicio: ${nombreServicio}\n` +
    `Cliente: ${cliente?.nombre || 'N/A'}\n` +
    `Email: ${cliente?.email || 'N/A'}\n` +
    `Teléfono: ${cliente?.telefono || 'N/A'}\n` +
    (notas ? `\nNotas: ${notas}` : '');
  const evento = {
    summary: titulo,
    description: descripcion,
    start: { dateTime: fechaSesionISO, timeZone: 'America/Bogota' },
    end: { dateTime: fechaFinISO, timeZone: 'America/Bogota' },
    conferenceData: { createRequest: { requestId: `meet-${sesion.id}-${Date.now()}` } },
    reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 24 * 60 }, { method: 'popup', minutes: 15 }] }
  };
  const calendarResponse = await calendar.events.insert({
    calendarId: GOOGLE_CALENDAR_ID,
    conferenceDataVersion: 1,
    requestBody: evento,
  });
  const eventoCreado = calendarResponse.data;
  const meetLink = eventoCreado.hangoutLink || eventoCreado.conferenceData?.entryPoints?.[0]?.uri;
  console.log('✅ Evento creado en Google Calendar:', { eventoId: eventoCreado.id, meetLink: meetLink || 'No disponible' });
  return { eventoCreado, meetLink };
}

async function handlePostSesion(req, res) {
  const usuarioId = req.headers['x-usuario-id'] ?? null;
  const { clienteId, fecha, hora, servicio, estado, notas, urlReunion, crearEnCalendario } = req.body;
  console.log('➕ Creando sesión - UsuarioId:', usuarioId, 'ClienteId:', clienteId);
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
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
  if (crearEnCalendario !== false) {
    try {
      const calendarResult = await tryCreateCalendarEventForSesion(sesion, cliente, fecha, hora, servicio, notas, urlReunion);
      if (calendarResult) {
        const { eventoCreado, meetLink } = calendarResult;
        const datosActualizacion = { eventoId: eventoCreado.id };
        if (meetLink && !urlReunion) datosActualizacion.urlReunion = meetLink;
        const sesionActualizada = await prisma.sesion.update({
          where: { id: sesion.id },
          data: datosActualizacion,
          include: { cliente: true }
        });
        if (meetLink && !urlReunion) console.log('✅ Enlace de Google Meet agregado desde calendario:', meetLink);
        console.log('✅ EventoId guardado en sesión:', eventoCreado.id);
        res.status(201).json({
          sesion: sesionActualizada,
          eventoCalendario: { eventoId: eventoCreado.id, meetLink, htmlLink: eventoCreado.htmlLink }
        });
        return;
      }
    } catch (calendarError) {
      console.error('⚠️ Error al crear evento en Google Calendar (sesión guardada):', calendarError);
    }
  }
  res.status(201).json({ sesion });
}

export default async function handler(req, res) {
  try {
    setCORSHeaders(req, res);
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
    console.log(`🔍 [${req.method}] /api/sesiones - Origin: ${origin}`);
    if (req.method === 'OPTIONS') {
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
    const { id, action } = req.query;
    if (id && (action === 'delete' || action === 'update')) {
      const body = req.body || {};
      const usuarioId = body.usuarioId || req.headers['x-usuario-id'] || null;
      console.log(`🔍 Acción sobre sesión ${id}: ${action}`);
      if (action === 'delete') return await handleDeleteSession(id, res);
      return await handleUpdateSession(id, body, usuarioId, res);
    }
    if (req.method === 'GET') return await handleGetSesiones(req, res);
    if (req.method === 'POST') return await handlePostSesion(req, res);
    res.status(405).json({ error: 'Method not allowed' });
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
      errorMessage = 'Error de conexión a la base de datos';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      type: error.constructor.name
    });
  }
}

