// API endpoint para recuperar adjuntos desde Storage y asociarlos a propuestas
// GET /api/propuestas/recuperar-adjuntos?id=PROPUESTA_ID

import { createClient } from '@supabase/supabase-js';
import prisma from '../lib/prisma.js';
import { setCORSHeaders } from '../lib/cors.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    const allowedOrigin = setCORSHeaders(req, res);
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        error: 'Supabase no configurado. Variables VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas.' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID de propuesta requerido' });
    }

    console.log(`🔍 Recuperando adjuntos para propuesta: ${id}`);

    // Obtener la propuesta
    const propuesta = await prisma.propuesta.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        adjuntos: true,
        createdAt: true,
      },
    });

    if (!propuesta) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }

    console.log(`📋 Propuesta encontrada: ${propuesta.titulo}`);
    console.log(`📦 Adjuntos actuales en BD:`, propuesta.adjuntos);

    // Listar todos los archivos en el bucket 'propuestas'
    const { data: archivos, error: errorListar } = await supabase.storage
      .from('propuestas')
      .list('propuestas', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (errorListar) {
      console.error('❌ Error al listar archivos:', errorListar);
      return res.status(500).json({ 
        error: 'Error al listar archivos en Storage',
        details: errorListar.message 
      });
    }

    console.log(`📁 Archivos encontrados en Storage: ${archivos.length}`);

    // Filtrar archivos que podrían pertenecer a esta propuesta
    // Los archivos se nombran con timestamp, así que buscamos archivos creados cerca de la fecha de creación de la propuesta
    const fechaCreacion = new Date(propuesta.createdAt);
    const archivosCandidatos = archivos.filter(archivo => {
      const fechaArchivo = new Date(archivo.created_at);
      const diferenciaDias = Math.abs((fechaArchivo - fechaCreacion) / (1000 * 60 * 60 * 24));
      // Archivos creados dentro de 1 día de la creación de la propuesta
      return diferenciaDias <= 1;
    });

    console.log(`🎯 Archivos candidatos: ${archivosCandidatos.length}`);

    if (archivosCandidatos.length === 0) {
      return res.status(404).json({ 
        message: 'No se encontraron archivos en Storage para esta propuesta',
        archivosEnStorage: archivos.length
      });
    }

    // Construir array de adjuntos con URLs públicas
    const adjuntos = archivosCandidatos.map(archivo => {
      const { data: urlData } = supabase.storage
        .from('propuestas')
        .getPublicUrl(`propuestas/${archivo.name}`);

      return {
        url: urlData.publicUrl,
        nombre: archivo.name,
        tipo: archivo.metadata?.mimetype?.startsWith('image/') ? 'imagen' : 'documento',
        tamaño: archivo.metadata?.size || 0
      };
    });

    console.log(`✅ Adjuntos recuperados:`, adjuntos);

    // Actualizar la propuesta con los adjuntos recuperados
    const adjuntosJson = JSON.stringify(adjuntos);
    
    const propuestaActualizada = await prisma.propuesta.update({
      where: { id },
      data: {
        adjuntos: adjuntosJson
      },
      select: {
        id: true,
        titulo: true,
        adjuntos: true,
      },
    });

    // Parsear adjuntos para la respuesta
    let adjuntosParseados = null;
    if (propuestaActualizada.adjuntos && typeof propuestaActualizada.adjuntos === 'string') {
      try {
        adjuntosParseados = JSON.parse(propuestaActualizada.adjuntos);
      } catch (e) {
        console.error('Error al parsear adjuntos:', e);
      }
    }

    console.log(`✅ Propuesta actualizada exitosamente`);

    res.status(200).json({
      success: true,
      message: 'Adjuntos recuperados y asociados correctamente',
      propuesta: {
        ...propuestaActualizada,
        adjuntos: adjuntosParseados
      },
      archivosEncontrados: archivosCandidatos.length,
      archivosTotalesEnStorage: archivos.length
    });

  } catch (error) {
    console.error('❌ Error en /api/propuestas/recuperar-adjuntos:', error);
    res.status(500).json({ 
      error: error.message || 'Error interno del servidor' 
    });
  }
}

