// Vercel Serverless Function - Gestión de Clientes (DELETE y PUT por ID)
import prisma from '../lib/prisma.js';

export default async function handler(req, res) {
  // Configurar CORS - DEBE IR PRIMERO (antes de cualquier otra cosa)
  // Orígenes permitidos
  const allowedOrigins = [
    'https://www.digiautomatiza.co',
    'https://digiautomatiza.co',
    'https://digiautomatiza.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol'
  );

  // Manejar preflight OPTIONS - responder inmediatamente
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { id } = req.query;

    if (req.method === 'DELETE') {
      // Eliminar cliente
      console.log(`🗑️ Eliminando cliente ${id}`);
      
      await prisma.cliente.delete({ where: { id } });
      
      console.log(`✅ Cliente eliminado exitosamente: ${id}`);
      
      // Headers para evitar caché y asegurar CORS
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
      
      // Headers para evitar caché
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
    
    // Asegurar que los headers CORS estén presentes incluso en errores
    const allowedOrigins = [
      'https://www.digiautomatiza.co',
      'https://digiautomatiza.co',
      'https://digiautomatiza.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Type', 'application/json');
    
    // Manejar errores específicos de Prisma
    let statusCode = 500;
    let errorMessage = error.message || 'Error interno del servidor';
    
    if (error.code === 'P2025') {
      // Registro no encontrado
      statusCode = 404;
      errorMessage = 'Cliente no encontrado';
    } else if (error.code === 'P2002') {
      // Violación de constraint único
      statusCode = 409;
      errorMessage = 'Ya existe un cliente con estos datos';
    } else if (error.code === 'P2003') {
      // Violación de foreign key
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

