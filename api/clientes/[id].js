// Vercel Serverless Function - Gestión de Clientes (DELETE y PUT por ID)
import prisma from '../lib/prisma.js';

export default async function handler(req, res) {
  // Configurar CORS - DEBE IR PRIMERO
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol'
  );

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { id } = req.query;

    if (req.method === 'DELETE') {
      // Eliminar cliente
      await prisma.cliente.delete({ where: { id } });
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ success: true });
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      // Actualizar cliente
      const datos = req.body;
      const cliente = await prisma.cliente.update({
        where: { id },
        data: datos,
      });
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ cliente });
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`Error en /api/clientes/${req.query.id}:`, error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message });
  }
}

