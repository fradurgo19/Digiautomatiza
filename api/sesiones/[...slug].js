// Vercel Serverless Function - Gestión de Sesiones (combinado: GET, POST, PUT, PATCH, DELETE)
import prisma from '../lib/prisma.js';
import { setCORSHeaders } from '../lib/cors.js';

export default async function handler(req, res) {
  try {
    // Configurar CORS - DEBE IR PRIMERO (antes de cualquier otra cosa)
    const allowedOrigin = setCORSHeaders(req, res);
    
    // Log para debugging
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
    const slug = req.query.slug || [];
    const id = Array.isArray(slug) ? slug[0] : slug;
    console.log(`🔍 [${req.method}] /api/sesiones${id ? `/${id}` : ''} - Origin: ${origin}, Allowed: ${allowedOrigin}`);

    // Manejar preflight OPTIONS - responder inmediatamente
    if (req.method === 'OPTIONS') {
      console.log('✅ OPTIONS preflight recibido - Origin:', origin, 'Allowed:', allowedOrigin);
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
    const slug = req.query.slug || [];
    const id = Array.isArray(slug) ? slug[0] : slug;

    if (req.method === 'GET') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const rol = req.headers['x-usuario-rol'] ?? null;
      const isAdmin = rol && String(rol).toLowerCase() === 'admin';

      let where = undefined;
      if (usuarioId && !isAdmin) {
        where = { usuarioId: String(usuarioId) };
      }

      console.log('📋 Obteniendo sesiones - Admin:', isAdmin, 'UsuarioId:', usuarioId, 'Filtro:', where);

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
      
      console.log('✅ Sesión creada exitosamente:', sesion.id, 'UsuarioId:', sesion.usuarioId);
      
      res.status(201).json({ sesion });
    } else if (req.method === 'DELETE' && id) {
      console.log(`🗑️ Eliminando sesión ${id}`);
      
      await prisma.sesion.delete({ where: { id } });
      
      console.log(`✅ Sesión eliminada exitosamente: ${id}`);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ success: true });
    } else if ((req.method === 'PUT' || req.method === 'PATCH') && id) {
      const datos = { ...req.body };
      
      console.log(`🔄 Actualizando sesión ${id} con datos:`, JSON.stringify(datos, null, 2));
      
      if (datos.fecha) {
        datos.fecha = new Date(datos.fecha);
      }
      
      const sesion = await prisma.sesion.update({
        where: { id },
        data: datos,
        include: { cliente: true },
      });
      
      console.log(`✅ Sesión actualizada exitosamente:`, sesion.id);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ sesion });
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`❌ Error en /api/sesiones${req.query.slug ? `/${req.query.slug}` : ''}:`, error.message);
    console.error('📋 Método:', req.method);
    console.error('📋 Stack:', error.stack);
    
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
    } else if (error.code === 'P2025') {
      statusCode = 404;
      errorMessage = 'Sesión no encontrada';
    } else if (error.code === 'P2002') {
      statusCode = 409;
      errorMessage = 'Ya existe una sesión con estos datos';
    } else if (error.code === 'P2003') {
      statusCode = 400;
      errorMessage = 'Datos inválidos: referencia a registro inexistente';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      type: error.constructor.name,
      code: error.code
    });
  }
}

