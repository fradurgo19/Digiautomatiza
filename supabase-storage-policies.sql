-- Políticas RLS para el bucket 'propuestas' en Supabase Storage
-- Ejecutar en Supabase SQL Editor después de crear el bucket

-- 1. Habilitar RLS en el bucket (si no está habilitado)
-- Nota: Esto se hace desde la UI, pero incluimos el comando por si acaso

-- 2. Eliminar políticas existentes si existen (para evitar errores)
DROP POLICY IF EXISTS "Permitir subir archivos a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir archivos a usuarios anónimos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura pública de archivos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminar archivos a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminar archivos a usuarios anónimos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizar archivos a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizar archivos a usuarios anónimos" ON storage.objects;

-- 3. Política para INSERT (subir archivos) - Permitir a usuarios anónimos (si usas anon key)
-- IMPORTANTE: Esta política permite que cualquier usuario suba archivos
-- Úsala solo si tu aplicación usa la anon key y no requiere autenticación
CREATE POLICY "Permitir subir archivos a usuarios anónimos"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'propuestas'::text
);

-- 4. Política para SELECT (leer archivos) - Permitir acceso público
CREATE POLICY "Permitir lectura pública de archivos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'propuestas'::text
);

-- 5. Política para DELETE (eliminar archivos) - Permitir a usuarios anónimos (si usas anon key)
CREATE POLICY "Permitir eliminar archivos a usuarios anónimos"
ON storage.objects
FOR DELETE
TO anon
USING (
  bucket_id = 'propuestas'::text
);

-- 6. Política para UPDATE (actualizar archivos) - Permitir a usuarios anónimos (si usas anon key)
CREATE POLICY "Permitir actualizar archivos a usuarios anónimos"
ON storage.objects
FOR UPDATE
TO anon
USING (
  bucket_id = 'propuestas'::text
);

-- Verificar que las políticas se crearon correctamente
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%propuestas%';

