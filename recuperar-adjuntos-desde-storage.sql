-- Script para recuperar adjuntos desde Storage y asociarlos a propuestas
-- Ejecutar en Supabase SQL Editor
-- 
-- INSTRUCCIONES:
-- 1. Ve a Storage en Supabase y busca el archivo en el bucket 'propuestas'
-- 2. Copia la URL pública del archivo
-- 3. Ejecuta el UPDATE con la URL correcta

-- Paso 1: Ver todas las propuestas que tienen adjuntos NULL
SELECT 
  id,
  titulo,
  "createdAt",
  "updatedAt",
  adjuntos
FROM public.propuestas
WHERE adjuntos IS NULL
ORDER BY "createdAt" DESC;

-- Paso 2: ACTUALIZAR con la URL real del archivo desde Storage
-- URL del archivo: https://kixlndfaipkgkhxqbdao.supabase.co/storage/v1/object/public/propuestas/propuestas/1763922361122-w7ihz9284f8.png
-- Nombre del archivo: 1763922361122-w7ihz9284f8.png
-- Tipo: imagen (PNG)

UPDATE public.propuestas
SET adjuntos = '[{"url":"https://kixlndfaipkgkhxqbdao.supabase.co/storage/v1/object/public/propuestas/propuestas/1763922361122-w7ihz9284f8.png","nombre":"1763922361122-w7ihz9284f8.png","tipo":"imagen","tamaño":0}]'
WHERE id = 'cmib10f5f0001l8040v1rwwdk';

-- Paso 3: Verificar que se actualizó correctamente
SELECT 
  id,
  titulo,
  adjuntos,
  LENGTH(adjuntos::text) as longitud,
  LEFT(adjuntos::text, 200) as primeros_caracteres
FROM public.propuestas
WHERE id = 'cmib10f5f0001l8040v1rwwdk';

-- NOTA: Para obtener la URL pública del archivo:
-- 1. Ve a Supabase Dashboard → Storage → propuestas
-- 2. Busca el archivo (puede estar en la carpeta 'propuestas' dentro del bucket)
-- 3. Haz clic derecho en el archivo → "Copy URL" o "Get public URL"
-- 4. Copia esa URL y úsala en el UPDATE de arriba

