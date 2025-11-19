// Vercel Serverless Function - Gestión de Oportunidades por ID (PUT, PATCH, DELETE)
import prisma from '../lib/prisma.js';

// Función para establecer CORS de manera directa y síncrona
function setCORSHeadersDirect(req, res) {
  const allowedOrigins = [
    'https://www.digiautomatiza.co',
    'https://digiautomatiza.co',
    'https://digiautomatiza.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  
  return allowedOrigin;
}

export default async function handler(req, res) {
  // Establecer CORS de manera directa y síncrona - PRIMERO, ANTES DE TODO
  const allowedOrigin = setCORSHeadersDirect(req, res);
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
  const { id } = req.query;
  
  console.log(`🔍 [${req.method}] /api/oportunidades/${id} - Origin: ${origin}, Allowed: ${allowedOrigin}`);

  // Manejar preflight OPTIONS - responder inmediatamente
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
    
    // Re-establecer CORS en caso de error
    setCORSHeadersDirect(req, res);
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

