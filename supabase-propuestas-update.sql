-- Actualización de tabla propuestas para agregar especificaciones y adjuntos
-- Ejecutar en Supabase SQL Editor

-- Agregar columna especificaciones
ALTER TABLE public.propuestas 
ADD COLUMN IF NOT EXISTS especificaciones text;

-- Agregar columna adjuntos (JSON array de URLs)
ALTER TABLE public.propuestas 
ADD COLUMN IF NOT EXISTS adjuntos text;

-- Comentarios
COMMENT ON COLUMN public.propuestas.especificaciones IS 'Especificaciones detalladas del servicio ofrecido';
COMMENT ON COLUMN public.propuestas.adjuntos IS 'JSON array con información de archivos adjuntos (URLs, nombres, tipos)';

