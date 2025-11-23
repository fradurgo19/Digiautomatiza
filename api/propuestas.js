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
        if (datos.fechaInicio) {
          datos.fechaInicio = new Date(datos.fechaInicio);
        }
        if (datos.fechaEntrega) {
          datos.fechaEntrega = new Date(datos.fechaEntrega);
        }
        // Convertir tareasProyecto a JSON si es array
        if (datos.tareasProyecto && typeof datos.tareasProyecto !== 'string') {
          datos.tareasProyecto = JSON.stringify(datos.tareasProyecto);
        }

        // Convertir items y adjuntos a JSON si son arrays/objetos
        if (datos.items && typeof datos.items !== 'string') {
          datos.items = JSON.stringify(datos.items);
        }
        // Manejar adjuntos: convertir a JSON si es array, mantener null si es null/undefined/vacío
        if (datos.adjuntos === null || datos.adjuntos === undefined || 
            datos.adjuntos === 'null' || datos.adjuntos === '' ||
            (Array.isArray(datos.adjuntos) && datos.adjuntos.length === 0)) {
          datos.adjuntos = null;
        } else if (typeof datos.adjuntos !== 'string') {
          // Si es un array, convertirlo a JSON string
          datos.adjuntos = JSON.stringify(datos.adjuntos);
        }
        // Si ya es string, dejarlo como está (puede ser JSON válido o "null")
        if (datos.contenido && typeof datos.contenido !== 'string') {
          datos.contenido = JSON.stringify(datos.contenido);
        }

        console.log(`🔄 Actualizando propuesta ${id} - UsuarioId: ${usuarioId}`, datos);
        
        // Manejar campos opcionales correctamente
        const datosLimpios = { ...datos };
        // Si especificaciones está vacío, establecer como null
        if (datosLimpios.especificaciones === '' || datosLimpios.especificaciones === undefined) {
          datosLimpios.especificaciones = null;
        }
        // Asegurar que adjuntos sea null o un string JSON válido
        if (datosLimpios.adjuntos === null || datosLimpios.adjuntos === undefined || 
            datosLimpios.adjuntos === 'null' || datosLimpios.adjuntos === '') {
          datosLimpios.adjuntos = null;
        } else if (typeof datosLimpios.adjuntos === 'string') {
          // Si ya es string, validar que sea JSON válido o "null"
          if (datosLimpios.adjuntos.trim() === '' || datosLimpios.adjuntos.trim() === 'null') {
            datosLimpios.adjuntos = null;
          }
          // Si es un string JSON válido, dejarlo como está
        }
        
        let propuesta;
        try {
          propuesta = await prisma.propuesta.update({
            where: { id },
            data: datosLimpios,
            include: { cliente: true, oportunidad: true },
          });
        } catch (updateError) {
          // Si falla por columnas que no existen, intentar sin esas columnas
          if (updateError.message && updateError.message.includes('does not exist')) {
            console.log('⚠️ Columnas nuevas no encontradas en update, omitiéndolas...');
            delete datosLimpios.especificaciones;
            delete datosLimpios.adjuntos;
            delete datosLimpios.estadoAprobacion;
            delete datosLimpios.fechaInicio;
            delete datosLimpios.fechaEntrega;
            delete datosLimpios.tareasProyecto;
            propuesta = await prisma.propuesta.update({
              where: { id },
              data: datosLimpios,
              include: { cliente: true, oportunidad: true },
            });
            // Agregar campos como null
            propuesta.especificaciones = null;
            propuesta.adjuntos = null;
            propuesta.estadoAprobacion = datos.estadoAprobacion || 'Sin Aprobar';
            propuesta.fechaInicio = datos.fechaInicio ? new Date(datos.fechaInicio) : null;
            propuesta.fechaEntrega = datos.fechaEntrega ? new Date(datos.fechaEntrega) : null;
            propuesta.tareasProyecto = datos.tareasProyecto || null;
          } else {
            throw updateError;
          }
        }
        
        console.log(`✅ Propuesta actualizada exitosamente: ${propuesta.id}`);
        console.log('📦 Adjuntos guardados en BD:', propuesta.adjuntos);
        console.log('📦 Tipo de adjuntos en BD:', typeof propuesta.adjuntos);
        
        // Asegurar que adjuntos se parsee correctamente en la respuesta
        if (propuesta.adjuntos && typeof propuesta.adjuntos === 'string') {
          try {
            propuesta.adjuntos = JSON.parse(propuesta.adjuntos);
            console.log('✅ Adjuntos parseados correctamente:', propuesta.adjuntos);
          } catch (e) {
            console.error('❌ Error al parsear adjuntos en respuesta:', e);
            propuesta.adjuntos = null;
          }
        }
        
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

      // Intentar consulta normal primero, si falla por columnas faltantes, usar select explícito
      let propuestas;
      try {
        propuestas = await prisma.propuesta.findMany({
          ...(where && { where }),
          include: { cliente: true, oportunidad: true },
          orderBy: { createdAt: 'desc' },
        });
      } catch (schemaError) {
        // Si falla por columnas que no existen, usar select explícito sin las columnas nuevas
        if (schemaError.message && schemaError.message.includes('does not exist')) {
          console.log('⚠️ Columnas nuevas no encontradas, usando select explícito...');
          propuestas = await prisma.propuesta.findMany({
            ...(where && { where }),
            select: {
              id: true,
              oportunidadId: true,
              clienteId: true,
              usuarioId: true,
              titulo: true,
              numeroPropuesta: true,
              servicio: true,
              estado: true,
              estadoAprobacion: true,
              fechaInicio: true,
              fechaEntrega: true,
              tareasProyecto: true,
              valorTotal: true,
              descuento: true,
              valorFinal: true,
              validez: true,
              fechaVencimiento: true,
              contenido: true,
              items: true,
              especificaciones: true,
              adjuntos: true,
              notas: true,
              fechaEnvio: true,
              fechaAceptacion: true,
              fechaRechazo: true,
              motivoRechazo: true,
              createdAt: true,
              updatedAt: true,
              cliente: true,
              oportunidad: true,
            },
            orderBy: { createdAt: 'desc' },
          });
          
          // Parsear adjuntos y otros campos JSON para todas las propuestas
          propuestas = propuestas.map(p => {
            const propuesta = { ...p };
            
            // Parsear adjuntos si existe
            if (propuesta.adjuntos && typeof propuesta.adjuntos === 'string' && propuesta.adjuntos !== 'null' && propuesta.adjuntos.trim() !== '') {
              try {
                propuesta.adjuntos = JSON.parse(propuesta.adjuntos);
                console.log('✅ Adjuntos parseados en GET:', propuesta.adjuntos);
              } catch (e) {
                console.error('❌ Error al parsear adjuntos en GET:', e, 'Valor:', propuesta.adjuntos);
                propuesta.adjuntos = null;
              }
            } else if (!propuesta.adjuntos || propuesta.adjuntos === 'null' || propuesta.adjuntos === '') {
              propuesta.adjuntos = null;
            }
            
            // Asegurar valores por defecto para campos opcionales
            if (!propuesta.estadoAprobacion) {
              propuesta.estadoAprobacion = 'Sin Aprobar';
            }
            
            return propuesta;
          });
        } else {
          throw schemaError;
        }
      }
      
      console.log(`✅ Propuestas obtenidas: ${propuestas.length}`);
      
      // Asegurar que adjuntos se parseen correctamente en todas las propuestas
      propuestas = propuestas.map(p => {
        if (p.adjuntos && typeof p.adjuntos === 'string') {
          try {
            p.adjuntos = JSON.parse(p.adjuntos);
          } catch (e) {
            console.error('Error al parsear adjuntos en propuesta:', p.id, e);
            p.adjuntos = null;
          }
        }
        return p;
      });
      
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
      
      const dataToCreate = {
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
        notas: notas || null,
        usuarioId: usuarioId ? String(usuarioId) : null,
        estadoAprobacion: 'Sin Aprobar', // Inicializar estado de aprobación
      };
      
      // Agregar campos nuevos solo si existen en el schema
      if (especificaciones) {
        dataToCreate.especificaciones = especificaciones;
      }
      if (adjuntos) {
        dataToCreate.adjuntos = typeof adjuntos === 'string' ? adjuntos : JSON.stringify(adjuntos);
      }
      
      let propuesta;
      try {
        propuesta = await prisma.propuesta.create({
          data: dataToCreate,
          include: { cliente: true, oportunidad: true },
        });
      } catch (createError) {
        // Si falla por columnas que no existen, intentar sin esas columnas
        if (createError.message && createError.message.includes('does not exist')) {
          console.log('⚠️ Columnas nuevas no encontradas en create, omitiéndolas...');
          delete dataToCreate.especificaciones;
          delete dataToCreate.adjuntos;
          delete dataToCreate.estadoAprobacion;
          propuesta = await prisma.propuesta.create({
            data: dataToCreate,
            include: { cliente: true, oportunidad: true },
          });
          // Agregar campos como null
          propuesta.especificaciones = null;
          propuesta.adjuntos = null;
          propuesta.estadoAprobacion = 'Sin Aprobar';
          propuesta.fechaInicio = null;
          propuesta.fechaEntrega = null;
          propuesta.tareasProyecto = null;
        } else {
          throw createError;
        }
      }
      
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

