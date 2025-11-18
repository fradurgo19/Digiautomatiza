// Vercel Serverless Function - Stats comerciales para Dashboard
import prisma from './lib/prisma.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    const whereCliente = {};
    const whereSesion = {};

    if (usuarioId && !isAdmin) {
      whereCliente.usuarioId = String(usuarioId);
      whereSesion.usuarioId = String(usuarioId);
    }

    const [totalClientes, clientesInteresados, sesionesProgramadas, sesionesCompletadas] =
      await Promise.all([
        prisma.cliente.count({ where: whereCliente }),
        prisma.cliente.count({
          where: {
            ...whereCliente,
            estado: { in: ['interesado', 'en-negociacion', 'convertido'] },
          },
        }),
        prisma.sesion.count({
          where: {
            ...whereSesion,
            estado: { in: ['programada', 'confirmada', 'reprogramada'] },
          },
        }),
        prisma.sesion.count({
          where: {
            ...whereSesion,
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


