-- Agregar columna eventoId a la tabla sesiones
-- Ejecutar en Supabase SQL Editor

-- Agregar columna eventoId para vincular sesiones con eventos de Google Calendar
ALTER TABLE public.sesiones
ADD COLUMN IF NOT EXISTS "eventoId" text;

-- Agregar índice para mejorar búsquedas por eventoId
CREATE INDEX IF NOT EXISTS "sesiones_eventoId_idx" ON public.sesiones("eventoId");

-- Comentario
COMMENT ON COLUMN public.sesiones."eventoId" IS 'ID del evento en Google Calendar asociado a esta sesión';

