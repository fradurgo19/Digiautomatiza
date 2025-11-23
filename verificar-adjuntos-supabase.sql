-- Script para verificar el valor del campo adjuntos en la tabla propuestas
-- Ejecutar en Supabase SQL Editor

-- Ver todas las propuestas con su campo adjuntos
SELECT 
  id,
  titulo,
  adjuntos,
  CASE 
    WHEN adjuntos IS NULL THEN 'NULL'
    WHEN adjuntos = '' THEN 'VACÍO'
    ELSE 'TIENE VALOR'
  END as estado_adjuntos,
  LENGTH(adjuntos::text) as longitud_adjuntos,
  LEFT(adjuntos::text, 200) as primeros_caracteres,
  created_at,
  updated_at
FROM public.propuestas
ORDER BY updated_at DESC;

-- Ver específicamente la propuesta problemática
SELECT 
  id,
  titulo,
  adjuntos,
  typeof(adjuntos) as tipo_dato,
  adjuntos IS NULL as es_null,
  adjuntos = '' as es_vacio,
  LENGTH(COALESCE(adjuntos, '')) as longitud
FROM public.propuestas
WHERE id = 'cmib10f5f0001l8040v1rwwdk';

