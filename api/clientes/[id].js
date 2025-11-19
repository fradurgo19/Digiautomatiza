// Vercel Serverless Function - Gestión de Clientes por ID (PUT, PATCH, DELETE)
import prisma from '../lib/prisma.js';
import { setCORSHeaders } from '../lib/cors.js';

export default async function handler(req, res) {
  try {
    // Configurar CORS - DEBE IR PRIMERO (antes de cualquier otra cosa)
    const allowedOrigin = setCORSHeaders(req, res);
    
    // Log para debugging
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
    const { id } = req.query;
    console.log(`🔍 [${req.method}] /api/clientes/${id} - Origin: ${origin}, Allowed: ${allowedOrigin}`);

    // Manejar preflight OPTIONS - responder inmediatamente
    if (req.method === 'OPTIONS') {
      console.log('✅ OPTIONS preflight recibido - Origin:', origin, 'Allowed:', allowedOrigin);
      res.status(200).end();
      return;
    }
  } catch (corsError) {
    console.error('Error al establecer CORS:', corsError);
    setCORSHeaders(req, res);
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  }
  
  try {
    const { id } = req.query;

    if (req.method === 'DELETE') {
      // Eliminar cliente
      console.log(`🗑️ Eliminando cliente ${id}`);
      
      await prisma.cliente.delete({ where: { id } });
      
      console.log(`✅ Cliente eliminado exitosamente: ${id}`);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ success: true });
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      // Actualizar cliente
      const datos = req.body;
      
      console.log(`🔄 Actualizando cliente ${id} con datos:`, JSON.stringify(datos, null, 2));
      
      const cliente = await prisma.cliente.update({
        where: { id },
        data: datos,
      });
      
      console.log(`✅ Cliente actualizado exitosamente:`, cliente.id);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      res.status(200).json({ cliente });
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`❌ Error en /api/clientes/${req.query.id}:`, error.message);
    console.error('📋 Método:', req.method);
    console.error('📋 Stack:', error.stack);
    
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
      errorMessage = 'Cliente no encontrado';
    } else if (error.code === 'P2002') {
      statusCode = 409;
      errorMessage = 'Ya existe un cliente con estos datos';
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

