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

        // Log detallado ANTES de procesar adjuntos
        console.log(`📦 ADJUNTOS RECIBIDOS EN UPDATE - ANTES de procesar:`, {
          adjuntosRaw: datos.adjuntos,
          tipo: typeof datos.adjuntos,
          esNull: datos.adjuntos === null,
          esUndefined: datos.adjuntos === undefined,
          esString: typeof datos.adjuntos === 'string',
          esArray: Array.isArray(datos.adjuntos),
          longitud: Array.isArray(datos.adjuntos) ? datos.adjuntos.length : (typeof datos.adjuntos === 'string' ? datos.adjuntos.length : 'N/A'),
          primerosCaracteres: typeof datos.adjuntos === 'string' ? datos.adjuntos.substring(0, 200) : 'N/A',
          valorCompleto: datos.adjuntos
        });

        // Convertir items y adjuntos a JSON si son arrays/objetos
        if (datos.items && typeof datos.items !== 'string') {
          datos.items = JSON.stringify(datos.items);
        }
        // Manejar adjuntos: convertir a JSON si es array, mantener null si es null/undefined/vacío
        if (datos.adjuntos === null || datos.adjuntos === undefined || 
            datos.adjuntos === 'null' || datos.adjuntos === '' ||
            (Array.isArray(datos.adjuntos) && datos.adjuntos.length === 0)) {
          console.log(`⚠️ ADJUNTOS establecidos como null (vacío o inválido)`);
          datos.adjuntos = null;
        } else if (typeof datos.adjuntos !== 'string') {
          // Si es un array, convertirlo a JSON string
          console.log(`✅ ADJUNTOS es array, convirtiendo a JSON string`);
          datos.adjuntos = JSON.stringify(datos.adjuntos);
          console.log(`✅ ADJUNTOS convertido:`, datos.adjuntos);
        } else {
          console.log(`✅ ADJUNTOS ya es string, manteniendo:`, datos.adjuntos.substring(0, 200));
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
        // Log ANTES de limpiar adjuntos
        console.log(`🧹 ADJUNTOS ANTES de limpiar:`, {
          adjuntos: datosLimpios.adjuntos,
          tipo: typeof datosLimpios.adjuntos
        });

        // Asegurar que adjuntos sea null o un string JSON válido
        if (datosLimpios.adjuntos === null || datosLimpios.adjuntos === undefined || 
            datosLimpios.adjuntos === 'null' || datosLimpios.adjuntos === '') {
          console.log(`🧹 ADJUNTOS limpiado a null`);
          datosLimpios.adjuntos = null;
        } else if (typeof datosLimpios.adjuntos === 'string') {
          console.log(`🧹 ADJUNTOS es string válido, manteniendo:`, datosLimpios.adjuntos.substring(0, 200));
          // Si ya es string, validar que sea JSON válido o "null"
          if (datosLimpios.adjuntos.trim() === '' || datosLimpios.adjuntos.trim() === 'null') {
            datosLimpios.adjuntos = null;
          }
          // Si es un string JSON válido, dejarlo como está
        }
        
        // Log ANTES de actualizar en Prisma
        console.log(`💾 DATOS QUE SE VAN A GUARDAR EN PRISMA:`, {
          id,
          adjuntos: datosLimpios.adjuntos,
          tipoAdjuntos: typeof datosLimpios.adjuntos,
          esNull: datosLimpios.adjuntos === null,
          longitud: typeof datosLimpios.adjuntos === 'string' ? datosLimpios.adjuntos.length : 'N/A',
          primerosCaracteres: typeof datosLimpios.adjuntos === 'string' ? datosLimpios.adjuntos.substring(0, 200) : 'N/A'
        });

        let propuesta;
        try {
          propuesta = await prisma.propuesta.update({
            where: { id },
            data: datosLimpios,
            include: { cliente: true, oportunidad: true },
          });
          
          // Log DESPUÉS de actualizar en Prisma
          console.log(`✅ PROPUESTA ACTUALIZADA EN PRISMA:`, {
            id: propuesta.id,
            titulo: propuesta.titulo,
            adjuntosRaw: propuesta.adjuntos,
            tipoAdjuntos: typeof propuesta.adjuntos,
            esNull: propuesta.adjuntos === null,
            longitud: typeof propuesta.adjuntos === 'string' ? propuesta.adjuntos.length : 'N/A',
            primerosCaracteres: typeof propuesta.adjuntos === 'string' ? propuesta.adjuntos.substring(0, 200) : 'N/A'
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

      // SOLUCIÓN DEFINITIVA: Usar select explícito SIEMPRE para asegurar que adjuntos se incluya
      let propuestas;
      try {
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
            adjuntos: true, // Asegurar que adjuntos se incluya siempre
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
      } catch (schemaError) {
        // Si falla por columnas que no existen, intentar sin las columnas nuevas
        if (schemaError.message && schemaError.message.includes('does not exist')) {
          console.log('⚠️ Algunas columnas no encontradas, usando select sin columnas nuevas...');
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
              valorTotal: true,
              descuento: true,
              valorFinal: true,
              validez: true,
              fechaVencimiento: true,
              contenido: true,
              items: true,
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
          
          // Agregar campos opcionales como null si no existen
          propuestas = propuestas.map(p => ({
            ...p,
            especificaciones: null,
            adjuntos: null,
            estadoAprobacion: 'Sin Aprobar',
            fechaInicio: null,
            fechaEntrega: null,
            tareasProyecto: null,
          }));
        } else {
          throw schemaError;
        }
      }
      
      console.log(`✅ Propuestas obtenidas: ${propuestas.length}`);
      
      // Log detallado ANTES de parsear para diagnosticar
      propuestas.forEach((p, index) => {
        console.log(`📦 Propuesta ${index + 1} (${p.id}) - ANTES de parsear:`, {
          titulo: p.titulo,
          adjuntosRaw: p.adjuntos,
          tipoAdjuntos: typeof p.adjuntos,
          esNull: p.adjuntos === null,
          esUndefined: p.adjuntos === undefined,
          esString: typeof p.adjuntos === 'string',
          longitud: p.adjuntos ? (typeof p.adjuntos === 'string' ? p.adjuntos.length : 'N/A') : 'N/A',
          primerosCaracteres: typeof p.adjuntos === 'string' ? p.adjuntos.substring(0, 100) : 'N/A'
        });
      });
      
      // Parsear adjuntos y otros campos JSON para todas las propuestas
      propuestas = propuestas.map(p => {
        const propuesta = { ...p };
        
        // Parsear adjuntos si existe
        if (propuesta.adjuntos && typeof propuesta.adjuntos === 'string' && propuesta.adjuntos !== 'null' && propuesta.adjuntos.trim() !== '') {
          try {
            const parsed = JSON.parse(propuesta.adjuntos);
            propuesta.adjuntos = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : null);
            console.log(`✅ Adjuntos parseados para ${p.id}:`, propuesta.adjuntos);
          } catch (e) {
            console.error(`❌ Error al parsear adjuntos para ${p.id}:`, e.message, 'Valor:', propuesta.adjuntos?.substring(0, 200));
            propuesta.adjuntos = null;
          }
        } else if (!propuesta.adjuntos || propuesta.adjuntos === 'null' || propuesta.adjuntos === '') {
          console.log(`⚠️ Adjuntos vacíos o null para ${p.id}`);
          propuesta.adjuntos = null;
        } else if (Array.isArray(propuesta.adjuntos)) {
          console.log(`✅ Adjuntos ya es array para ${p.id}:`, propuesta.adjuntos);
        }
        
        // Asegurar valores por defecto
        if (!propuesta.estadoAprobacion) {
          propuesta.estadoAprobacion = 'Sin Aprobar';
        }
        
        return propuesta;
      });
      
      // Log DESPUÉS de parsear
      propuestas.forEach((p, index) => {
        console.log(`📦 Propuesta ${index + 1} (${p.id}) - DESPUÉS de parsear:`, {
          titulo: p.titulo,
          adjuntos: p.adjuntos,
          tipoAdjuntos: typeof p.adjuntos,
          esArray: Array.isArray(p.adjuntos),
          longitud: Array.isArray(p.adjuntos) ? p.adjuntos.length : 'N/A'
        });
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

      // Generar número de propuesta único
      const timestamp = Date.now();
      const numeroPropuesta = `PROP-${timestamp}`;

      // Convertir items y adjuntos a JSON si son arrays/objetos
      const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);
      let adjuntosJson = null;
      if (adjuntos && Array.isArray(adjuntos) && adjuntos.length > 0) {
        adjuntosJson = JSON.stringify(adjuntos);
      } else if (adjuntos && typeof adjuntos === 'string' && adjuntos !== 'null' && adjuntos.trim() !== '') {
        adjuntosJson = adjuntos;
      }

      const propuesta = await prisma.propuesta.create({
        data: {
          oportunidadId: oportunidadId || null,
          clienteId,
          usuarioId: usuarioId ? String(usuarioId) : null,
          titulo,
          numeroPropuesta,
          servicio,
          estado: 'borrador',
          estadoAprobacion: 'Sin Aprobar',
          valorTotal: parseFloat(valorTotal) || 0,
          descuento: descuento ? parseFloat(descuento) : 0,
          valorFinal: parseFloat(valorFinal) || parseFloat(valorTotal) || 0,
          validez: parseInt(validez) || 30,
          contenido: typeof contenido === 'string' ? contenido : JSON.stringify(contenido || {}),
          items: itemsJson,
          especificaciones: especificaciones || null,
          adjuntos: adjuntosJson,
          notas: notas || null,
        },
        include: { cliente: true, oportunidad: true },
      });

      console.log('✅ Propuesta creada exitosamente:', propuesta.id);
      console.log('📦 Adjuntos guardados:', propuesta.adjuntos);

      // Parsear adjuntos en la respuesta
      if (propuesta.adjuntos && typeof propuesta.adjuntos === 'string') {
        try {
          propuesta.adjuntos = JSON.parse(propuesta.adjuntos);
        } catch (e) {
          console.error('❌ Error al parsear adjuntos en respuesta:', e);
          propuesta.adjuntos = null;
        }
      }

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
