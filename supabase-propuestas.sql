-- 7) Tabla: propuestas (propuestas y cotizaciones comerciales)
CREATE TABLE IF NOT EXISTS public.propuestas (
  id                  text        PRIMARY KEY,
  "oportunidadId"     text        NULL,
  "clienteId"         text        NOT NULL,
  "usuarioId"         text        NULL,
  titulo              text        NOT NULL,
  "numeroPropuesta"   text        NOT NULL UNIQUE,
  servicio            text        NOT NULL,
  estado              text        NOT NULL DEFAULT 'borrador', -- borrador, enviada, revisada, aceptada, rechazada, vencida
  "valorTotal"        double precision NOT NULL,
  descuento           double precision NULL DEFAULT 0,
  "valorFinal"        double precision NOT NULL,
  validez             integer     NOT NULL DEFAULT 30,         -- días de validez
  "fechaVencimiento"  timestamptz NULL,
  contenido           text        NOT NULL,                    -- JSON con el contenido de la propuesta
  items               text        NOT NULL,                     -- JSON con items de la propuesta
  notas               text        NULL,
  "fechaEnvio"        timestamptz NULL,
  "fechaAceptacion"   timestamptz NULL,
  "fechaRechazo"      timestamptz NULL,
  "motivoRechazo"     text        NULL,
  "createdAt"         timestamptz NOT NULL DEFAULT now(),
  "updatedAt"         timestamptz NOT NULL DEFAULT now()
);

-- Índices propuestas
CREATE INDEX IF NOT EXISTS idx_propuestas_clienteId        ON public.propuestas ("clienteId");
CREATE INDEX IF NOT EXISTS idx_propuestas_oportunidadId    ON public.propuestas ("oportunidadId");
CREATE INDEX IF NOT EXISTS idx_propuestas_estado          ON public.propuestas (estado);
CREATE INDEX IF NOT EXISTS idx_propuestas_fechaVencimiento ON public.propuestas ("fechaVencimiento");

-- FKs propuestas
ALTER TABLE public.propuestas
  ADD CONSTRAINT fk_propuestas_cliente
  FOREIGN KEY ("clienteId") REFERENCES public.clientes(id)
  ON DELETE CASCADE;

ALTER TABLE public.propuestas
  ADD CONSTRAINT fk_propuestas_usuario
  FOREIGN KEY ("usuarioId") REFERENCES public.usuarios(id)
  ON DELETE SET NULL;

ALTER TABLE public.propuestas
  ADD CONSTRAINT fk_propuestas_oportunidad
  FOREIGN KEY ("oportunidadId") REFERENCES public.oportunidades(id)
  ON DELETE SET NULL;

