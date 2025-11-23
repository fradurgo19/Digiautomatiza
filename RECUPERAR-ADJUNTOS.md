# 🔧 Guía para Recuperar Adjuntos desde Storage

## Problema
Los archivos están en Supabase Storage pero el campo `adjuntos` en la tabla `propuestas` está como `null`.

## Solución Manual (Rápida)

### Paso 1: Obtener la URL del archivo desde Storage

1. Ve a **Supabase Dashboard** → **Storage** → **propuestas**
2. Busca el archivo (puede estar en la carpeta `propuestas` dentro del bucket)
3. Haz clic derecho en el archivo → **"Copy URL"** o **"Get public URL"**
4. Copia la URL completa (ejemplo: `https://kixlndfaipkgkhxqbdao.supabase.co/storage/v1/object/public/propuestas/propuestas/1763862011383-02nixnazfpur.pdf`)

### Paso 2: Actualizar la propuesta en Supabase SQL Editor

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta este script, reemplazando los valores:

```sql
-- Reemplaza estos valores:
-- - 'TU_URL_AQUI' con la URL que copiaste en el Paso 1
-- - 'NOMBRE_ARCHIVO.pdf' con el nombre real del archivo
-- - 'cmib10f5f0001l8040v1rwwdk' con el ID de la propuesta

UPDATE public.propuestas
SET adjuntos = '[{"url":"TU_URL_AQUI","nombre":"NOMBRE_ARCHIVO.pdf","tipo":"documento","tamaño":0}]'
WHERE id = 'cmib10f5f0001l8040v1rwwdk';
```

### Paso 3: Verificar

```sql
SELECT 
  id,
  titulo,
  adjuntos
FROM public.propuestas
WHERE id = 'cmib10f5f0001l8040v1rwwdk';
```

## Solución Automática (Futura)

Se está desarrollando un endpoint API (`/api/propuestas/recuperar-adjuntos`) que automáticamente:
1. Lista los archivos en Storage
2. Los asocia a las propuestas por fecha de creación
3. Actualiza el campo `adjuntos` en la base de datos

## Prevención

Para evitar que esto vuelva a pasar, asegúrate de que:
1. Cuando se sube un archivo, se guarde inmediatamente en el campo `adjuntos`
2. Cuando se actualiza una propuesta, se preserven los adjuntos existentes
3. Los logs muestren claramente qué se está guardando

