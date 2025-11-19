// Vercel Serverless Function - Gestión de Sesiones por ID (PUT, PATCH, DELETE)
import prisma from '../lib/prisma.js';
import { setCORSHeaders } from '../lib/cors.js';

export default async function handler(req, res) {
  // Configurar CORS - DEBE IR PRIMERO, ANTES DE CUALQUIER OTRA COSA
  // No usar try-catch aquí para asegurar que los headers siempre se establezcan
  const allowedOrigin = setCORSHeaders(req, res);
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
  const { id } = req.query;
  console.log(`🔍 [${req.method}] /api/sesiones/${id} - Origin: ${origin}, Allowed: ${allowedOrigin}`);

  // Manejar preflight OPTIONS - responder inmediatamente con headers CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight recibido - Origin:', origin, 'Allowed:', allowedOrigin);
    res.status(200).end();
    return;
  }
  
  try {
    const { id } = req.query;

    if (req.method === 'DELETE') {
      console.log(`🗑️ Eliminando sesión ${id}`);
      
      await prisma.sesion.delete({ where: { id } });
      
      console.log(`✅ Sesión eliminada exitosamente: ${id}`);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ success: true });
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      const datos = { ...req.body };
      
      console.log(`🔄 Actualizando sesión ${id} con datos:`, JSON.stringify(datos, null, 2));
      
      if (datos.fecha) {
        datos.fecha = new Date(datos.fecha);
      }
      
      const sesion = await prisma.sesion.update({
        where: { id },
        data: datos,
        include: { cliente: true },
      });
      
      console.log(`✅ Sesión actualizada exitosamente:`, sesion.id);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ sesion });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`❌ Error en /api/sesiones/${req.query.id}:`, error.message);
    
    try {
      setCORSHeaders(req, res);
    } catch (corsError) {
      console.error('Error al establecer CORS en catch:', corsError);
    }
    res.setHeader('Content-Type', 'application/json');
    
    let statusCode = 500;
    let errorMessage = error.message || 'Error interno del servidor';
    
    if (error.code === 'P2025') {
      statusCode = 404;
      errorMessage = 'Sesión no encontrada';
    } else if (error.code === 'P2002') {
      statusCode = 409;
      errorMessage = 'Ya existe una sesión con estos datos';
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

