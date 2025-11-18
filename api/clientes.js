// Vercel Serverless Function - Gestión de Clientes
import prisma from './lib/prisma.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const rol = req.headers['x-usuario-rol'] ?? null;
      const isAdmin = rol && String(rol).toLowerCase() === 'admin';

      const where = {};
      // Solo filtrar por usuario si NO es admin
      if (usuarioId && !isAdmin) {
        where.usuarioId = String(usuarioId);
      }

      // Obtener todos los clientes
      const clientes = await prisma.cliente.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      
      res.status(200).json({ clientes });
    } else if (req.method === 'POST') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      // Crear nuevo cliente
      const cliente = await prisma.cliente.create({
        data: {
          ...req.body,
          usuarioId: usuarioId ? String(usuarioId) : null,
        },
      });
      
      res.status(201).json({ cliente });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error en /api/clientes:', error);
    res.status(500).json({ error: error.message });
  }
}

