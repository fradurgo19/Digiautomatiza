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
  
  // Establecer headers de manera explícita y síncrona
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol'
    );
    res.setHeader('Access-Control-Max-Age', '86400');
  } catch (error) {
    console.error('Error al establecer headers CORS:', error);
  }
  
  return allowedOrigin;
}

export default async function handler(req, res) {
  // Establecer CORS de manera directa y síncrona - PRIMERO, ANTES DE TODO
  const allowedOrigin = setCORSHeadersDirect(req, res);
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
  const { id } = req.query;
  
  console.log(`🔍 [${req.method}] /api/oportunidades/${id} - Origin: ${origin}, Allowed: ${allowedOrigin}`);

  // Manejar preflight OPTIONS - responder inmediatamente con headers explícitos
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight recibido - Origin:', origin, 'Allowed:', allowedOrigin);
    // Asegurar que los headers estén establecidos antes de responder
    // Usar writeHead para garantizar que los headers se envíen
    try {
      res.writeHead(200, {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol',
        'Access-Control-Max-Age': '86400',
        'Content-Length': '0'
      });
      res.end();
    } catch (error) {
      console.error('Error al responder OPTIONS:', error);
      // Fallback: usar setHeader y status
      setCORSHeadersDirect(req, res);
      res.status(200).end();
    }
    return;
  }
  
  try {
    const { id } = req.query;
    const body = req.body || {};
    const action = body.action || body._method; // Soporte para action o _method

    // Determinar la acción: DELETE, PUT/PATCH, o POST con action
    const isDelete = req.method === 'DELETE' || action === 'delete';
    const isUpdate = req.method === 'PUT' || req.method === 'PATCH' || action === 'update';

    if (isDelete) {
      console.log(`🗑️ Eliminando oportunidad ${id} (método: ${req.method}, action: ${action})`);
      
      await prisma.oportunidad.delete({ where: { id } });
      
      console.log(`✅ Oportunidad eliminada exitosamente: ${id}`);
      
      // Asegurar que los headers CORS estén presentes en la respuesta
      setCORSHeadersDirect(req, res);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ success: true });
    } else if (isUpdate) {
      const datos = { ...body };
      // Remover action/_method del body si existe
      delete datos.action;
      delete datos._method;
      
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
      
      // Asegurar que los headers CORS estén presentes en la respuesta
      setCORSHeadersDirect(req, res);
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

