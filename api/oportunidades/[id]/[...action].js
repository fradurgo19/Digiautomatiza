// Vercel Serverless Function - Acciones de Oportunidad (DELETE, UPDATE)
// Ruta: /api/oportunidades/[id]/[...action] captura /api/oportunidades/[id]/delete o /api/oportunidades/[id]/update
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
    const { id, action } = req.query; // action es un array: ['delete'] o ['update']
    const actionType = Array.isArray(action) ? action[0] : action;
    const body = req.body || {};
    const usuarioId = body.usuarioId || null;
    const rol = body.rol || null;

    console.log(`🔍 Acción solicitada: ${actionType} para oportunidad ${id}`);

    if (actionType === 'delete') {
      console.log(`🗑️ Eliminando oportunidad ${id} - UsuarioId: ${usuarioId}`);
      await prisma.oportunidad.delete({ where: { id } });
      console.log(`✅ Oportunidad eliminada exitosamente: ${id}`);
      res.status(200).json({ success: true });
    } else if (actionType === 'update') {
      // Remover usuarioId y rol del body antes de actualizar
      const datos = { ...body };
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
    } else {
      res.status(400).json({ error: 'Acción no válida. Use "delete" o "update"' });
    }
  } catch (error) {
    console.error(`❌ Error en acción de oportunidad ${req.query.id}:`, error.message);

    setCORSHeaders(req, res);
    let statusCode = 500;
    let errorMessage = error.message || 'Error interno del servidor';

    if (error.code === 'P2025') {
      statusCode = 404;
      errorMessage = 'Oportunidad no encontrada';
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      code: error.code
    });
  }
}

