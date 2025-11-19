// Vercel Serverless Function - Gestión de Oportunidades por ID (PUT, PATCH, DELETE)
import prisma from '../lib/prisma.js';
import { setCORSHeaders } from '../lib/cors.js';

export default async function handler(req, res) {
  // Configurar CORS - DEBE IR PRIMERO, ANTES DE CUALQUIER OTRA COSA
  // No usar try-catch aquí para asegurar que los headers siempre se establezcan
  const allowedOrigin = setCORSHeaders(req, res);
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
  const { id } = req.query;
  console.log(`🔍 [${req.method}] /api/oportunidades/${id} - Origin: ${origin}, Allowed: ${allowedOrigin}`);

  // Manejar preflight OPTIONS - responder inmediatamente con headers CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight recibido - Origin:', origin, 'Allowed:', allowedOrigin);
    res.status(200).end();
    return;
  }
  
  try {
    const { id } = req.query;

    if (req.method === 'DELETE') {
      console.log(`🗑️ Eliminando oportunidad ${id}`);
      
      await prisma.oportunidad.delete({ where: { id } });
      
      console.log(`✅ Oportunidad eliminada exitosamente: ${id}`);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ success: true });
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      const datos = { ...req.body };
      
      console.log(`🔄 Actualizando oportunidad ${id} con datos:`, JSON.stringify(datos, null, 2));
      
      if (datos.fechaCierreEstimada) {
        datos.fechaCierreEstimada = new Date(datos.fechaCierreEstimada);
      }
      
      const oportunidad = await prisma.oportunidad.update({
        where: { id },
        data: datos,
        include: { cliente: true },
      });
      
      console.log(`✅ Oportunidad actualizada exitosamente:`, oportunidad.id);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ oportunidad });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`❌ Error en /api/oportunidades/${req.query.id}:`, error.message);
    
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
      errorMessage = 'Oportunidad no encontrada';
    } else if (error.code === 'P2002') {
      statusCode = 409;
      errorMessage = 'Ya existe una oportunidad con estos datos';
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

