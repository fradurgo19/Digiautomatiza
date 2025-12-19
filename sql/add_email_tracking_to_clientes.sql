-- Agregar campos de seguimiento de correos a la tabla clientes
-- Ejecutar este script en Supabase SQL Editor
-- Para ejecutar: Ve a Supabase Dashboard > SQL Editor > New Query > Pega este script > Run

-- Agregar columnas si no existen
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS "totalEmailsEnviados" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "ultimoEmailEnviado" TIMESTAMP;

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_clientes_total_emails ON public.clientes("totalEmailsEnviados");
CREATE INDEX IF NOT EXISTS idx_clientes_ultimo_email ON public.clientes("ultimoEmailEnviado");

-- Comentarios en las columnas
COMMENT ON COLUMN public.clientes."totalEmailsEnviados" IS 'Contador de correos enviados al cliente';
COMMENT ON COLUMN public.clientes."ultimoEmailEnviado" IS 'Fecha del último correo enviado al cliente';

