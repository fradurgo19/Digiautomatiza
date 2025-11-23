-- Agregar columnas de fechas de proyecto y tareas para diagrama de Gantt
-- Ejecutar este script en Supabase SQL Editor

ALTER TABLE public.propuestas
ADD COLUMN IF NOT EXISTS "fechaInicio" timestamp with time zone;

ALTER TABLE public.propuestas
ADD COLUMN IF NOT EXISTS "fechaEntrega" timestamp with time zone;

ALTER TABLE public.propuestas
ADD COLUMN IF NOT EXISTS "tareasProyecto" text;

-- Crear índices para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_propuestas_fecha_inicio ON public.propuestas("fechaInicio");
CREATE INDEX IF NOT EXISTS idx_propuestas_fecha_entrega ON public.propuestas("fechaEntrega");

-- Comentarios en las columnas
COMMENT ON COLUMN public.propuestas."fechaInicio" IS 'Fecha de inicio del proyecto (módulo DEV)';
COMMENT ON COLUMN public.propuestas."fechaEntrega" IS 'Fecha de entrega estimada del proyecto (módulo DEV)';
COMMENT ON COLUMN public.propuestas."tareasProyecto" IS 'JSON array con tareas del proyecto para el diagrama de Gantt. Formato: [{"id": "string", "nombre": "string", "fechaInicio": "YYYY-MM-DD", "fechaFin": "YYYY-MM-DD", "duracion": number, "progreso": number, "responsable": "string"}]';

