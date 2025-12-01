-- =====================================================
-- Script SQL para crear tabla de Transacciones
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Crear la tabla de transacciones
CREATE TABLE IF NOT EXISTS "transacciones" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT,
  "referencia" TEXT NOT NULL UNIQUE,
  "pasarela" TEXT NOT NULL DEFAULT 'payu',
  "estado" TEXT NOT NULL DEFAULT 'pendiente',
  "metodoPago" TEXT,
  "valor" DOUBLE PRECISION NOT NULL,
  "moneda" TEXT NOT NULL DEFAULT 'COP',
  "descripcion" TEXT,
  "datosPago" TEXT,
  "respuestaPasarela" TEXT,
  "transactionId" TEXT,
  "urlPago" TEXT,
  "fechaPago" TIMESTAMP(3),
  "fechaConfirmacion" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Agregar foreign key constraint a usuarios (si existe la tabla usuarios)
-- Nota: Ajusta el nombre de la tabla si es diferente
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
    ALTER TABLE "transacciones" 
    ADD CONSTRAINT "transacciones_usuarioId_fkey" 
    FOREIGN KEY ("usuarioId") 
    REFERENCES "usuarios"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
  END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "transacciones_usuarioId_idx" ON "transacciones"("usuarioId");
CREATE INDEX IF NOT EXISTS "transacciones_referencia_idx" ON "transacciones"("referencia");
CREATE INDEX IF NOT EXISTS "transacciones_estado_idx" ON "transacciones"("estado");
CREATE INDEX IF NOT EXISTS "transacciones_pasarela_idx" ON "transacciones"("pasarela");
CREATE INDEX IF NOT EXISTS "transacciones_transactionId_idx" ON "transacciones"("transactionId");
CREATE INDEX IF NOT EXISTS "transacciones_fechaPago_idx" ON "transacciones"("fechaPago");

-- Crear función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updatedAt
DROP TRIGGER IF EXISTS update_transacciones_updated_at ON "transacciones";
CREATE TRIGGER update_transacciones_updated_at
  BEFORE UPDATE ON "transacciones"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verificar que la tabla se creó correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'transacciones'
ORDER BY ordinal_position;

