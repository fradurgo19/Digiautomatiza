-- Agregar columna estadoAprobacion a la tabla propuestas
-- Ejecutar este script en Supabase SQL Editor

ALTER TABLE public.propuestas
ADD COLUMN IF NOT EXISTS "estadoAprobacion" text DEFAULT 'Sin Aprobar';

-- Crear índice para mejorar las consultas por estado de aprobación
CREATE INDEX IF NOT EXISTS idx_propuestas_estado_aprobacion ON public.propuestas("estadoAprobacion");

-- Comentario en la columna
COMMENT ON COLUMN public.propuestas."estadoAprobacion" IS 'Estado de aprobación de la propuesta: Aprobada o Sin Aprobar. Cuando cambia a Aprobada, la propuesta se mueve al módulo DEV.';

