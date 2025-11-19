// Vercel Serverless Function - Eliminar Cliente
import prisma from '../../lib/prisma.js';

function setCORSHeaders(req, res) {
  const allowedOrigins = [
    'https://www.digiautomatiza.co',
    'https://digiautomatiza.co',
    'https://digiautomatiza.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  return allowedOrigin;
}

export default async function handler(req, res) {
  // Manejar OPTIONS
  if (req.method === 'OPTIONS') {
    setCORSHeaders(req, res);
    res.status(200).end();
    return;
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    setCORSHeaders(req, res);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    setCORSHeaders(req, res);
    const { id } = req.query;
    const body = req.body || {};
    const usuarioId = body.usuarioId || null;
    const rol = body.rol || null;

    console.log(`🗑️ Eliminando cliente ${id} - UsuarioId: ${usuarioId}`);

    await prisma.cliente.delete({ where: { id } });

    console.log(`✅ Cliente eliminado exitosamente: ${id}`);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`❌ Error al eliminar cliente ${req.query.id}:`, error.message);

    setCORSHeaders(req, res);
    let statusCode = 500;
    let errorMessage = error.message || 'Error interno del servidor';

    if (error.code === 'P2025') {
      statusCode = 404;
      errorMessage = 'Cliente no encontrado';
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      code: error.code
    });
  }
}

