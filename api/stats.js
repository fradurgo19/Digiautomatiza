// Vercel Serverless Function - Stats comerciales para Dashboard
import prisma from './lib/prisma.js';

export default async function handler(req, res) {
  // Configurar CORS
  // Orígenes permitidos
  const allowedOrigins = [
    'https://www.digiautomatiza.co',
    'https://digiautomatiza.co',
    'https://digiautomatiza.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
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


