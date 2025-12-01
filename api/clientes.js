// Vercel Serverless Function - Gestión de Clientes (GET, POST)
import prisma from './lib/prisma.mjs';
import { setCORSHeaders } from './lib/cors.mjs';

export default async function handler(req, res) {
  try {
    // Configurar CORS - DEBE IR PRIMERO (antes de cualquier otra cosa)
    const allowedOrigin = setCORSHeaders(req, res);
    
    // Log para debugging
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
    console.log(`🔍 [${req.method}] /api/clientes - Origin: ${origin}, Allowed: ${allowedOrigin}`);

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
    // ========== STATS (GET con ?stats=true) ==========
    if (req.method === 'GET' && req.query.stats === 'true') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const rol = req.headers['x-usuario-rol'] ?? null;
      const isAdmin = rol && String(rol).toLowerCase() === 'admin';

      let whereCliente = undefined;
      let whereSesion = undefined;

      if (usuarioId && !isAdmin) {
        whereCliente = { usuarioId: String(usuarioId) };
        whereSesion = { usuarioId: String(usuarioId) };
      }

      const [totalClientes, clientesInteresados, sesionesProgramadas, sesionesCompletadas] = await Promise.all([
        prisma.cliente.count({ 
          ...(whereCliente && { where: whereCliente })
        }),
        prisma.cliente.count({
          where: {
            ...(whereCliente || {}),
            estado: { in: ['interesado', 'en-negociacion', 'convertido'] },
          },
        }),
        prisma.sesion.count({
          where: {
            ...(whereSesion || {}),
            estado: { in: ['programada', 'confirmada', 'reprogramada'] },
          },
        }),
        prisma.sesion.count({
          where: {
            ...(whereSesion || {}),
            estado: 'completada',
          },
        }),
      ]);

      return res.status(200).json({
        totalClientes,
        clientesInteresados,
        sesionesProgramadas,
        sesionesCompletadas,
        scope: isAdmin ? 'global' : 'usuario',
      });
    }

    // Verificar si hay un ID en el query (para delete/update)
    const { id, action } = req.query;
    
    if (id && (action === 'delete' || action === 'update')) {
      // Manejar acciones sobre un cliente específico
      const body = req.body || {};
      const usuarioId = body.usuarioId || req.headers['x-usuario-id'] || null;

      console.log(`🔍 Acción sobre cliente ${id}: ${action}`);

      if (action === 'delete') {
        console.log(`🗑️ Eliminando cliente ${id} - UsuarioId: ${usuarioId}`);
        await prisma.cliente.delete({ where: { id } });
        console.log(`✅ Cliente eliminado exitosamente: ${id}`);
        res.status(200).json({ success: true });
        return;
      } else if (action === 'update') {
        // Update
        const datos = { ...body };
        delete datos.action;
        delete datos.usuarioId;
        delete datos.rol;

        console.log(`🔄 Actualizando cliente ${id} - UsuarioId: ${usuarioId}`, datos);
        const cliente = await prisma.cliente.update({
          where: { id },
          data: datos,
        });
        console.log(`✅ Cliente actualizado exitosamente: ${cliente.id}`);
        res.status(200).json({ cliente });
        return;
      }
    }

    if (req.method === 'GET') {
      // Obtener todos los clientes
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const rol = req.headers['x-usuario-rol'] ?? null;
      const isAdmin = rol && String(rol).toLowerCase() === 'admin';

      let where = undefined;
      if (usuarioId && !isAdmin) {
        where = { usuarioId: String(usuarioId) };
      }

      console.log('📋 Obteniendo clientes - Admin:', isAdmin, 'UsuarioId:', usuarioId);

      const clientes = await prisma.cliente.findMany({
        ...(where && { where }),
        orderBy: { createdAt: 'desc' },
      });
      
      console.log(`✅ Clientes obtenidos: ${clientes.length}`);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ clientes });
    } else if (req.method === 'POST') {
      // Crear nuevo cliente
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const cliente = await prisma.cliente.create({
        data: {
          ...req.body,
          usuarioId: usuarioId ? String(usuarioId) : null,
        },
      });
      
      res.status(201).json({ cliente });
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Error en /api/clientes:', error.message);
    console.error('📋 Tipo de error:', error.constructor.name);
    
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
    } else if (error.code === 'P2002') {
      statusCode = 409;
      errorMessage = 'Ya existe un cliente con estos datos';
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

