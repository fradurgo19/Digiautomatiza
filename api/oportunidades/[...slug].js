// Vercel Serverless Function - Gestión de Oportunidades (combinado: GET, POST, PUT, PATCH, DELETE)
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
    console.log(`🔍 [${req.method}] /api/oportunidades${id ? `/${id}` : ''} - Origin: ${origin}, Allowed: ${allowedOrigin}`);

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
      const { etapa, clienteId } = req.query;
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const rol = req.headers['x-usuario-rol'] ?? null;
      const isAdmin = rol && String(rol).toLowerCase() === 'admin';
      const where = {};

      if (etapa && etapa !== 'todas') {
        where.etapa = etapa;
      }
      if (clienteId) {
        where.clienteId = clienteId;
      }
      if (usuarioId && !isAdmin) {
        where.usuarioId = String(usuarioId);
      }

      const whereFilter = Object.keys(where).length > 0 ? where : undefined;

      console.log('📋 Obteniendo oportunidades - Admin:', isAdmin, 'UsuarioId:', usuarioId, 'Filtro:', whereFilter);

      const oportunidades = await prisma.oportunidad.findMany({
        ...(whereFilter && { where: whereFilter }),
        include: { cliente: true },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`✅ Oportunidades obtenidas: ${oportunidades.length}`);

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');

      res.status(200).json({ oportunidades });
    } else if (req.method === 'POST') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const {
        clienteId,
        titulo,
        descripcion,
        servicioPrincipal,
        etapa,
        origen,
        valorEstimado,
        probabilidad,
        fechaCierreEstimada,
      } = req.body;

      const oportunidad = await prisma.oportunidad.create({
        data: {
          clienteId,
          titulo,
          descripcion,
          servicioPrincipal,
          etapa: etapa || 'nuevo',
          origen,
          valorEstimado: valorEstimado ?? null,
          probabilidad: probabilidad ?? null,
          fechaCierreEstimada: fechaCierreEstimada ? new Date(fechaCierreEstimada) : null,
          usuarioId: usuarioId ? String(usuarioId) : null,
        },
        include: { cliente: true },
      });

      res.status(201).json({ oportunidad });
    } else if (req.method === 'DELETE' && id) {
      console.log(`🗑️ Eliminando oportunidad ${id}`);
      
      await prisma.oportunidad.delete({ where: { id } });
      
      console.log(`✅ Oportunidad eliminada exitosamente: ${id}`);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ success: true });
    } else if ((req.method === 'PUT' || req.method === 'PATCH') && id) {
      const datos = { ...req.body };
      
      console.log(`🔄 Actualizando oportunidad ${id} con datos:`, JSON.stringify(datos, null, 2));
      
      if (datos.fechaCierreEstimada) {
        datos.fechaCierreEstimada = new Date(datos.fechaCierreEstimada);
      }
      
      const oportunidad = await prisma.oportunidad.update({
        where: { id },
        data: datos,
        include: { cliente: true },
      });
      
      console.log(`✅ Oportunidad actualizada exitosamente:`, oportunidad.id);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ oportunidad });
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`❌ Error en /api/oportunidades${req.query.slug ? `/${req.query.slug}` : ''}:`, error.message);
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
    
    if (error.code === 'P2025') {
      statusCode = 404;
      errorMessage = 'Oportunidad no encontrada';
    } else if (error.code === 'P2002') {
      statusCode = 409;
      errorMessage = 'Ya existe una oportunidad con estos datos';
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

