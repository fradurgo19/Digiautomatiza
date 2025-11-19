// Vercel Serverless Function - Gestión de Oportunidades (GET, POST)
import prisma from './lib/prisma.js';
import { setCORSHeaders } from './lib/cors.js';

export default async function handler(req, res) {
  try {
    const allowedOrigin = setCORSHeaders(req, res);
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
    console.log(`🔍 [${req.method}] /api/oportunidades - Origin: ${origin}, Allowed: ${allowedOrigin}`);

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
    const { id, action, etapa, clienteId } = req.query;
    
    if (id && (action === 'delete' || action === 'update')) {
      // Manejar acciones sobre una oportunidad específica
      const body = req.body || {};
      const usuarioId = body.usuarioId || req.headers['x-usuario-id'] || null;

      console.log(`🔍 Acción sobre oportunidad ${id}: ${action}`);

      if (action === 'delete') {
        console.log(`🗑️ Eliminando oportunidad ${id} - UsuarioId: ${usuarioId}`);
        await prisma.oportunidad.delete({ where: { id } });
        console.log(`✅ Oportunidad eliminada exitosamente: ${id}`);
        res.status(200).json({ success: true });
        return;
      } else if (action === 'update') {
        // Update
        const datos = { ...body };
        delete datos.action;
        delete datos.usuarioId;
        delete datos.rol;

        if (datos.fechaCierreEstimada) {
          datos.fechaCierreEstimada = new Date(datos.fechaCierreEstimada);
        }

        console.log(`🔄 Actualizando oportunidad ${id} - UsuarioId: ${usuarioId}`, datos);
        const oportunidad = await prisma.oportunidad.update({
          where: { id },
          data: datos,
          include: { cliente: true },
        });
        console.log(`✅ Oportunidad actualizada exitosamente: ${oportunidad.id}`);
        res.status(200).json({ oportunidad });
        return;
      }
    }

    if (req.method === 'GET') {
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

      console.log('📋 Obteniendo oportunidades - Admin:', isAdmin, 'UsuarioId:', usuarioId);

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
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Error en /api/oportunidades:', error.message);
    
    try {
      setCORSHeaders(req, res);
    } catch (corsError) {
      console.error('Error al establecer CORS en catch:', corsError);
    }
    res.setHeader('Content-Type', 'application/json');
    
    res.status(500).json({ 
      error: error.message || 'Error interno del servidor'
    });
  }
}

