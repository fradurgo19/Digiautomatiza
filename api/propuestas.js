// Vercel Serverless Function - Gestión de Propuestas (GET, POST, PUT, DELETE)
import prisma from './lib/prisma.js';
import { setCORSHeaders } from './lib/cors.js';

export default async function handler(req, res) {
  try {
    const allowedOrigin = setCORSHeaders(req, res);
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
    console.log(`🔍 [${req.method}] /api/propuestas - Origin: ${origin}, Allowed: ${allowedOrigin}`);

    if (req.method === 'OPTIONS') {
      console.log('✅ OPTIONS preflight recibido');
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
    const { id, action } = req.query;
    
    if (id && (action === 'delete' || action === 'update')) {
      const body = req.body || {};
      const usuarioId = body.usuarioId || req.headers['x-usuario-id'] || null;

      console.log(`🔍 Acción sobre propuesta ${id}: ${action}`);

      if (action === 'delete') {
        console.log(`🗑️ Eliminando propuesta ${id} - UsuarioId: ${usuarioId}`);
        await prisma.propuesta.delete({ where: { id } });
        console.log(`✅ Propuesta eliminada exitosamente: ${id}`);
        res.status(200).json({ success: true });
        return;
      } else if (action === 'update') {
        const datos = { ...body };
        delete datos.action;
        delete datos.usuarioId;
        delete datos.rol;
        delete datos.cliente; // No actualizar relación

        if (datos.fechaVencimiento) {
          datos.fechaVencimiento = new Date(datos.fechaVencimiento);
        }
        if (datos.fechaEnvio) {
          datos.fechaEnvio = new Date(datos.fechaEnvio);
        }
        if (datos.fechaAceptacion) {
          datos.fechaAceptacion = new Date(datos.fechaAceptacion);
        }
        if (datos.fechaRechazo) {
          datos.fechaRechazo = new Date(datos.fechaRechazo);
        }

        // Convertir items y adjuntos a JSON si son arrays/objetos
        if (datos.items && typeof datos.items !== 'string') {
          datos.items = JSON.stringify(datos.items);
        }
        if (datos.adjuntos && typeof datos.adjuntos !== 'string') {
          datos.adjuntos = JSON.stringify(datos.adjuntos);
        }
        if (datos.contenido && typeof datos.contenido !== 'string') {
          datos.contenido = JSON.stringify(datos.contenido);
        }

        console.log(`🔄 Actualizando propuesta ${id} - UsuarioId: ${usuarioId}`, datos);
        const propuesta = await prisma.propuesta.update({
          where: { id },
          data: datos,
          include: { cliente: true, oportunidad: true },
        });
        console.log(`✅ Propuesta actualizada exitosamente: ${propuesta.id}`);
        res.status(200).json({ propuesta });
        return;
      }
    }

    if (req.method === 'GET') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const rol = req.headers['x-usuario-rol'] ?? null;
      const isAdmin = rol && String(rol).toLowerCase() === 'admin';

      let where = undefined;
      if (usuarioId && !isAdmin) {
        where = { usuarioId: String(usuarioId) };
      }

      console.log('📋 Obteniendo propuestas - Admin:', isAdmin, 'UsuarioId:', usuarioId);

      const propuestas = await prisma.propuesta.findMany({
        ...(where && { where }),
        include: { cliente: true, oportunidad: true },
        orderBy: { createdAt: 'desc' },
      });
      
      console.log(`✅ Propuestas obtenidas: ${propuestas.length}`);
      
      res.status(200).json({ propuestas });
    } else if (req.method === 'POST') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const { 
        oportunidadId, 
        clienteId, 
        titulo, 
        servicio, 
        valorTotal, 
        descuento, 
        valorFinal,
        validez,
        contenido,
        items,
        especificaciones,
        adjuntos,
        notas 
      } = req.body;
      
      console.log('➕ Creando propuesta - UsuarioId:', usuarioId, 'ClienteId:', clienteId);
      
      // Generar número único de propuesta
      const fecha = new Date();
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const numeroAleatorio = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const numeroPropuesta = `PROP-${año}${mes}-${numeroAleatorio}`;
      
      // Calcular fecha de vencimiento
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + (validez || 30));
      
      const propuesta = await prisma.propuesta.create({
        data: {
          oportunidadId: oportunidadId || null,
          clienteId,
          titulo,
          numeroPropuesta,
          servicio,
          valorTotal: parseFloat(valorTotal) || 0,
          descuento: descuento ? parseFloat(descuento) : 0,
          valorFinal: parseFloat(valorFinal) || 0,
          validez: validez || 30,
          fechaVencimiento,
          contenido: typeof contenido === 'string' ? contenido : JSON.stringify(contenido),
          items: typeof items === 'string' ? items : JSON.stringify(items),
          especificaciones: especificaciones || null,
          adjuntos: adjuntos ? (typeof adjuntos === 'string' ? adjuntos : JSON.stringify(adjuntos)) : null,
          notas: notas || null,
          usuarioId: usuarioId ? String(usuarioId) : null,
        },
        include: { cliente: true, oportunidad: true },
      });
      
      console.log('✅ Propuesta creada exitosamente:', propuesta.id);
      
      res.status(201).json({ propuesta });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Error en /api/propuestas:', error.message);
    
    try {
      setCORSHeaders(req, res);
    } catch (corsError) {
      console.error('Error al establecer CORS en catch:', corsError);
    }
    res.setHeader('Content-Type', 'application/json');
    
    let statusCode = 500;
    let errorMessage = error.message || 'Error interno del servidor';
    
    if (error.name === 'PrismaClientInitializationError' || error.message.includes("Can't reach database")) {
      statusCode = 500;
      errorMessage = 'Error de conexión a la base de datos';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      type: error.constructor.name
    });
  }
}

