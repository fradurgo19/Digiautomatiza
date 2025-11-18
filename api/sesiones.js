// Vercel Serverless Function - Gestión de Sesiones
import prisma from './lib/prisma.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const rol = req.headers['x-usuario-rol'] ?? null;
      const isAdmin = rol && String(rol).toLowerCase() === 'admin';

      // Construir filtro de manera más explícita
      let where = undefined;
      
      // Solo filtrar por usuario si NO es admin y tiene usuarioId
      if (usuarioId && !isAdmin) {
        where = {
          usuarioId: String(usuarioId),
        };
      }
      // Si es admin o no hay usuarioId, where será undefined (obtiene todos)

      // Obtener todas las sesiones con cliente
      const sesiones = await prisma.sesion.findMany({
        ...(where && { where }),
        include: {
          cliente: true,
        },
        orderBy: { fecha: 'desc' },
      });
      
      res.status(200).json({ sesiones });
    } else if (req.method === 'POST') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      // Crear nueva sesión
      const { clienteId, fecha, hora, servicio, estado, notas, urlReunion } = req.body;
      
      const sesion = await prisma.sesion.create({
        data: {
          clienteId,
          fecha: new Date(fecha),
          hora,
          servicio,
          estado: estado || 'programada',
          notas,
          urlReunion,
          usuarioId: usuarioId ? String(usuarioId) : null,
        },
        include: {
          cliente: true,
        },
      });
      
      res.status(201).json({ sesion });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Error en /api/sesiones:', error.message);
    console.error('📋 Tipo de error:', error.constructor.name);
    
    // Manejo específico de errores de conexión
    if (error.name === 'PrismaClientInitializationError' || error.message.includes("Can't reach database")) {
      console.error('🔴 Error de conexión a la base de datos');
      console.error('💡 Verifica:');
      console.error('   1. DATABASE_URL en Vercel está configurada correctamente');
      console.error('   2. El proyecto de Supabase está activo (no pausado)');
      console.error('   3. La URL usa el puerto 5432 y tiene ?sslmode=require');
      
      res.status(500).json({ 
        error: 'Error de conexión a la base de datos',
        message: 'No se pudo conectar a Supabase. Verifica la configuración de DATABASE_URL en Vercel.',
        type: 'DATABASE_CONNECTION_ERROR'
      });
    } else {
      console.error('Stack trace:', error.stack);
      res.status(500).json({ 
        error: error.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

