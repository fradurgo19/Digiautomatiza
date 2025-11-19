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
        const sesion = await prisma.sesion.update({
          where: { id },
          data: datos,
          include: { cliente: true },
        });
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
      const { clienteId, fecha, hora, servicio, estado, notas, urlReunion } = req.body;
      
      console.log('➕ Creando sesión - UsuarioId:', usuarioId, 'ClienteId:', clienteId);
      
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

