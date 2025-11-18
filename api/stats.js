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

    // Construir filtros de manera explícita (undefined si no hay filtro)
    let whereCliente = undefined;
    let whereSesion = undefined;

    if (usuarioId && !isAdmin) {
      whereCliente = { usuarioId: String(usuarioId) };
      whereSesion = { usuarioId: String(usuarioId) };
    }

    // Ejecutar consultas con pequeños delays para evitar conflictos de prepared statements
    // Transaction pooler puede tener problemas con consultas concurrentes
    const totalClientes = await prisma.cliente.count({ 
      ...(whereCliente && { where: whereCliente })
    });
    
    // Pequeño delay entre consultas para evitar conflictos
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const clientesInteresados = await prisma.cliente.count({
      where: {
        ...(whereCliente || {}),
        estado: { in: ['interesado', 'en-negociacion', 'convertido'] },
      },
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const sesionesProgramadas = await prisma.sesion.count({
      where: {
        ...(whereSesion || {}),
        estado: { in: ['programada', 'confirmada', 'reprogramada'] },
      },
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const sesionesCompletadas = await prisma.sesion.count({
      where: {
        ...(whereSesion || {}),
        estado: 'completada',
      },
    });

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


