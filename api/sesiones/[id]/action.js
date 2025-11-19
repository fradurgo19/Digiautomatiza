// Vercel Serverless Function - Acciones de Sesión (DELETE, UPDATE)
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
    const { id, action } = req.query; // action viene de la URL: /delete o /update
    const body = req.body || {};
    const usuarioId = body.usuarioId || null;
    const rol = body.rol || null;

    if (action === 'delete') {
      console.log(`🗑️ Eliminando sesión ${id} - UsuarioId: ${usuarioId}`);
      await prisma.sesion.delete({ where: { id } });
      console.log(`✅ Sesión eliminada exitosamente: ${id}`);
      res.status(200).json({ success: true });
    } else if (action === 'update') {
      // Remover usuarioId y rol del body antes de actualizar
      const datos = { ...body };
      delete datos.usuarioId;
      delete datos.rol;

      if (datos.fecha) {
        datos.fecha = new Date(datos.fecha);
      }

      console.log(`🔄 Actualizando sesión ${id} - UsuarioId: ${usuarioId}`, datos);
      const sesion = await prisma.sesion.update({
        where: { id },
        data: datos,
        include: { cliente: true },
      });
      console.log(`✅ Sesión actualizada exitosamente: ${sesion.id}`);
      res.status(200).json({ sesion });
    } else {
      res.status(400).json({ error: 'Acción no válida. Use "delete" o "update"' });
    }
  } catch (error) {
    console.error(`❌ Error en acción de sesión ${req.query.id}:`, error.message);

    setCORSHeaders(req, res);
    let statusCode = 500;
    let errorMessage = error.message || 'Error interno del servidor';

    if (error.code === 'P2025') {
      statusCode = 404;
      errorMessage = 'Sesión no encontrada';
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      code: error.code
    });
  }
}

