// Vercel Serverless Function - Gestión de Propuestas (GET, POST, PUT, DELETE)
import prisma from './lib/prisma.mjs';
import { setCORSHeaders } from './lib/cors.mjs';

const SELECT_PROPUESTA_FULL = {
  id: true,
  oportunidadId: true,
  clienteId: true,
  usuarioId: true,
  titulo: true,
  numeroPropuesta: true,
  servicio: true,
  estado: true,
  estadoAprobacion: true,
  fechaInicio: true,
  fechaEntrega: true,
  tareasProyecto: true,
  valorTotal: true,
  descuento: true,
  valorFinal: true,
  validez: true,
  fechaVencimiento: true,
  contenido: true,
  items: true,
  especificaciones: true,
  adjuntos: true,
  notas: true,
  fechaEnvio: true,
  fechaAceptacion: true,
  fechaRechazo: true,
  motivoRechazo: true,
  createdAt: true,
  updatedAt: true,
  cliente: true,
  oportunidad: true,
};

const SELECT_PROPUESTA_LEGACY = {
  id: true,
  oportunidadId: true,
  clienteId: true,
  usuarioId: true,
  titulo: true,
  numeroPropuesta: true,
  servicio: true,
  estado: true,
  valorTotal: true,
  descuento: true,
  valorFinal: true,
  validez: true,
  fechaVencimiento: true,
  contenido: true,
  items: true,
  notas: true,
  fechaEnvio: true,
  fechaAceptacion: true,
  fechaRechazo: true,
  motivoRechazo: true,
  createdAt: true,
  updatedAt: true,
  cliente: true,
  oportunidad: true,
};

function isAdjuntosEmpty(val) {
  if (val === null || val === undefined || val === 'null' || val === '') return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

function normalizeAdjuntosValue(adjuntos) {
  if (isAdjuntosEmpty(adjuntos)) return null;
  if (typeof adjuntos === 'string') {
    const trimmed = adjuntos.trim();
    if (trimmed === '' || trimmed === 'null') return null;
    try {
      JSON.parse(adjuntos);
      return adjuntos;
    } catch {
      return null;
    }
  }
  return JSON.stringify(adjuntos);
}

async function handleDeletePropuesta(id, res) {
  console.log(`🗑️ Eliminando propuesta ${id}`);
  await prisma.propuesta.delete({ where: { id } });
  console.log(`✅ Propuesta eliminada exitosamente: ${id}`);
  res.status(200).json({ success: true });
}

function prepareUpdateData(body) {
  const datos = { ...body };
  delete datos.action;
  delete datos.usuarioId;
  delete datos.rol;
  delete datos.cliente;
  const dateFields = ['fechaVencimiento', 'fechaEnvio', 'fechaAceptacion', 'fechaRechazo', 'fechaInicio', 'fechaEntrega'];
  for (const key of dateFields) {
    if (datos[key]) datos[key] = new Date(datos[key]);
  }
  if (datos.tareasProyecto && typeof datos.tareasProyecto !== 'string') {
    datos.tareasProyecto = JSON.stringify(datos.tareasProyecto);
  }
  if (datos.items && typeof datos.items !== 'string') {
    datos.items = JSON.stringify(datos.items);
  }
  datos.adjuntos = normalizeAdjuntosValue(datos.adjuntos);
  if (datos.contenido && typeof datos.contenido !== 'string') {
    datos.contenido = JSON.stringify(datos.contenido);
  }
  const datosLimpios = { ...datos };
  if (datosLimpios.especificaciones === '' || datosLimpios.especificaciones === undefined) {
    datosLimpios.especificaciones = null;
  }
  datosLimpios.adjuntos = normalizeAdjuntosValue(datosLimpios.adjuntos);
  return { datos, datosLimpios };
}

async function updatePropuestaWithSchemaFallback(id, datosLimpios, datos) {
  try {
    return await prisma.propuesta.update({
      where: { id },
      data: datosLimpios,
      include: { cliente: true, oportunidad: true },
    });
  } catch (updateError) {
    if (!updateError.message || !updateError.message.includes('does not exist')) {
      throw updateError;
    }
    console.log('⚠️ Columnas nuevas no encontradas en update, omitiéndolas...');
    console.warn(updateError.message);
    delete datosLimpios.especificaciones;
    delete datosLimpios.adjuntos;
    delete datosLimpios.estadoAprobacion;
    delete datosLimpios.fechaInicio;
    delete datosLimpios.fechaEntrega;
    delete datosLimpios.tareasProyecto;
    const propuesta = await prisma.propuesta.update({
      where: { id },
      data: datosLimpios,
      include: { cliente: true, oportunidad: true },
    });
    propuesta.especificaciones = null;
    propuesta.adjuntos = null;
    propuesta.estadoAprobacion = datos.estadoAprobacion || 'Sin Aprobar';
    propuesta.fechaInicio = datos.fechaInicio ? new Date(datos.fechaInicio) : null;
    propuesta.fechaEntrega = datos.fechaEntrega ? new Date(datos.fechaEntrega) : null;
    propuesta.tareasProyecto = datos.tareasProyecto || null;
    return propuesta;
  }
}

async function handleUpdatePropuesta(id, body, usuarioId, res) {
  const { datos, datosLimpios } = prepareUpdateData(body);
  console.log(`🔄 Actualizando propuesta ${id} - UsuarioId: ${usuarioId}`, datosLimpios);
  const propuesta = await updatePropuestaWithSchemaFallback(id, datosLimpios, datos);
  if (propuesta.adjuntos && typeof propuesta.adjuntos === 'string') {
    try {
      propuesta.adjuntos = JSON.parse(propuesta.adjuntos);
    } catch (error_) {
      console.error('❌ Error al parsear adjuntos en respuesta:', error_);
      propuesta.adjuntos = null;
    }
  }
  res.status(200).json({ propuesta });
}

async function handleGetPropuestas(req, res) {
  const usuarioId = req.headers['x-usuario-id'] ?? null;
  const rol = req.headers['x-usuario-rol'] ?? null;
  const isAdmin = rol && String(rol).toLowerCase() === 'admin';
  let where;
  if (usuarioId && !isAdmin) {
    where = { usuarioId: String(usuarioId) };
  }
  console.log('📋 Obteniendo propuestas - Admin:', isAdmin, 'UsuarioId:', usuarioId);

  let propuestas;
  try {
    propuestas = await prisma.propuesta.findMany({
      ...(where !== undefined && { where }),
      select: SELECT_PROPUESTA_FULL,
      orderBy: { createdAt: 'desc' },
    });
  } catch (schemaError) {
    if (schemaError.message && schemaError.message.includes('does not exist')) {
      console.log('⚠️ Algunas columnas no encontradas, usando select sin columnas nuevas...');
      console.warn(schemaError.message);
      propuestas = await prisma.propuesta.findMany({
        ...(where !== undefined && { where }),
        select: SELECT_PROPUESTA_LEGACY,
        orderBy: { createdAt: 'desc' },
      });
      propuestas = propuestas.map(p => ({
        ...p,
        especificaciones: null,
        adjuntos: null,
        estadoAprobacion: 'Sin Aprobar',
        fechaInicio: null,
        fechaEntrega: null,
        tareasProyecto: null,
      }));
    } else {
      throw schemaError;
    }
  }

  propuestas = propuestas.map(p => {
    const propuesta = { ...p };
    if (propuesta.adjuntos && typeof propuesta.adjuntos === 'string' && propuesta.adjuntos !== 'null' && propuesta.adjuntos.trim() !== '') {
      try {
        const parsed = JSON.parse(propuesta.adjuntos);
        let adjuntosVal;
        if (Array.isArray(parsed)) adjuntosVal = parsed;
        else if (parsed) adjuntosVal = [parsed];
        else adjuntosVal = null;
        propuesta.adjuntos = adjuntosVal;
      } catch {
        propuesta.adjuntos = null;
      }
    } else if (isAdjuntosEmpty(propuesta.adjuntos)) {
      propuesta.adjuntos = null;
    }
    if (!propuesta.estadoAprobacion) {
      propuesta.estadoAprobacion = 'Sin Aprobar';
    }
    return propuesta;
  });

  console.log(`✅ Propuestas obtenidas: ${propuestas.length}`);
  res.status(200).json({ propuestas });
}

async function handlePostPropuesta(req, res) {
  const usuarioId = req.headers['x-usuario-id'] ?? null;
  const {
    oportunidadId,
    clienteId,
    titulo,
    servicio,
    valorTotal,
    descuento,
    valorFinal,
    validez,
    contenido,
    items,
    especificaciones,
    adjuntos,
    notas
  } = req.body;

  const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);
  let adjuntosJson = null;
  if (adjuntos && Array.isArray(adjuntos) && adjuntos.length > 0) {
    adjuntosJson = JSON.stringify(adjuntos);
  } else if (adjuntos && typeof adjuntos === 'string' && adjuntos !== 'null' && adjuntos.trim() !== '') {
    adjuntosJson = adjuntos;
  }

  const propuesta = await prisma.propuesta.create({
    data: {
      oportunidadId: oportunidadId || null,
      clienteId,
      usuarioId: usuarioId ? String(usuarioId) : null,
      titulo,
      numeroPropuesta: `PROP-${Date.now()}`,
      servicio,
      estado: 'borrador',
      estadoAprobacion: 'Sin Aprobar',
      valorTotal: Number.parseFloat(valorTotal) || 0,
      descuento: descuento ? Number.parseFloat(descuento) : 0,
      valorFinal: Number.parseFloat(valorFinal) || Number.parseFloat(valorTotal) || 0,
      validez: Number.parseInt(validez, 10) || 30,
      contenido: typeof contenido === 'string' ? contenido : JSON.stringify(contenido || {}),
      items: itemsJson,
      especificaciones: especificaciones || null,
      adjuntos: adjuntosJson,
      notas: notas || null,
    },
    include: { cliente: true, oportunidad: true },
  });

  if (propuesta.adjuntos && typeof propuesta.adjuntos === 'string') {
    try {
      propuesta.adjuntos = JSON.parse(propuesta.adjuntos);
    } catch (e) {
      console.error('❌ Error al parsear adjuntos en respuesta:', e);
      propuesta.adjuntos = null;
    }
  }
  res.status(201).json({ propuesta });
}

export default async function handler(req, res) {
  try {
    const allowedOrigin = setCORSHeaders(req, res);
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
    console.log(`🔍 [${req.method}] /api/propuestas - Origin: ${origin}, Allowed: ${allowedOrigin}`);
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
      if (action === 'delete') return await handleDeletePropuesta(id, res);
      return await handleUpdatePropuesta(id, body, usuarioId, res);
    }
    if (req.method === 'GET') return await handleGetPropuestas(req, res);
    if (req.method === 'POST') return await handlePostPropuesta(req, res);
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Error en /api/propuestas:', error.message);
    try {
      setCORSHeaders(req, res);
    } catch (corsError) {
      console.error('Error al establecer CORS en catch:', corsError);
    }
    res.setHeader('Content-Type', 'application/json');
    let errorMessage = error.message || 'Error interno del servidor';
    if (error.name === 'PrismaClientInitializationError' || error.message.includes("Can't reach database")) {
      errorMessage = 'Error de conexión a la base de datos';
    }
    res.status(500).json({
      error: errorMessage,
      type: error.constructor.name
    });
  }
}
