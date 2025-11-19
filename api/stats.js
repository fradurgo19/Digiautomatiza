// Vercel Serverless Function - Stats comerciales para Dashboard y Health Check
import prisma from './lib/prisma.js';
import { setCORSHeaders } from './lib/cors.js';

export default async function handler(req, res) {
  try {
    // Configurar CORS
    const allowedOrigin = setCORSHeaders(req, res);
    
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
    console.log(`🔍 [${req.method}] /api/stats - Origin: ${origin}, Allowed: ${allowedOrigin}`);

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

  // Health check endpoint - si se accede a /api/stats?health=true
  if (req.query.health === 'true') {
    res.status(200).json({
      status: 'ok',
      message: 'API Digiautomatiza en Vercel',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const usuarioId = req.headers['x-usuario-id'] ?? null;
    const rol = req.headers['x-usuario-rol'] ?? null;
    const isAdmin = rol && String(rol).toLowerCase() === 'admin';

    // Construir filtros de manera explícita (undefined si no hay filtro)
    let whereCliente = undefined;
    let whereSesion = undefined;

    if (usuarioId && !isAdmin) {
      whereCliente = { usuarioId: String(usuarioId) };
      whereSesion = { usuarioId: String(usuarioId) };
    }

    // Ejecutar todas las consultas en paralelo usando Promise.all
    // Esto es más eficiente y evita problemas con prepared statements
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

    res.status(200).json({
      totalClientes,
      clientesInteresados,
      sesionesProgramadas,
      sesionesCompletadas,
      scope: isAdmin ? 'global' : 'usuario',
    });
  } catch (error) {
    console.error('Error en /api/stats:', error);
    res.status(500).json({ error: error.message });
  }
}


