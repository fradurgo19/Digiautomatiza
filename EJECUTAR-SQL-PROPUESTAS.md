# 📋 Instrucciones para Agregar Columnas a la Tabla Propuestas

## 🎯 Objetivo
Agregar las columnas `especificaciones` y `adjuntos` a la tabla `propuestas` en Supabase para que la funcionalidad de edición y adjuntos funcione correctamente.

## 📝 Pasos a Seguir

### 1. Acceder al SQL Editor de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. En el menú lateral, haz clic en **"SQL Editor"**
3. Haz clic en **"New query"** para crear una nueva consulta

### 2. Copiar y Ejecutar el SQL

Copia y pega el siguiente SQL en el editor:

```sql
-- Actualización de tabla propuestas para agregar especificaciones y adjuntos
-- Ejecutar en Supabase SQL Editor

-- Agregar columna especificaciones
ALTER TABLE public.propuestas 
ADD COLUMN IF NOT EXISTS especificaciones text;

-- Agregar columna adjuntos (JSON array de URLs)
ALTER TABLE public.propuestas 
ADD COLUMN IF NOT EXISTS adjuntos text;

-- Comentarios
COMMENT ON COLUMN public.propuestas.especificaciones IS 'Especificaciones detalladas del servicio ofrecido';
COMMENT ON COLUMN public.propuestas.adjuntos IS 'JSON array con información de archivos adjuntos (URLs, nombres, tipos)';
```

### 3. Ejecutar la Consulta

1. Haz clic en el botón **"Run"** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
2. Deberías ver un mensaje de éxito: **"Success. No rows returned"**

### 4. Verificar que las Columnas se Crearon

Para verificar que las columnas se agregaron correctamente, ejecuta esta consulta:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'propuestas'
  AND column_name IN ('especificaciones', 'adjuntos');
```

Deberías ver 2 filas con las columnas `especificaciones` y `adjuntos`, ambas de tipo `text` y `nullable = YES`.

## ✅ Verificación Final

Una vez ejecutado el SQL:

1. **Las propuestas existentes** seguirán funcionando (las nuevas columnas serán `NULL`)
2. **Al crear nuevas propuestas** podrás agregar especificaciones y adjuntos
3. **Al editar propuestas** podrás modificar especificaciones, valores y adjuntos
4. **Los archivos se subirán** al bucket `propuestas` de Supabase Storage

## 🔧 Notas Importantes

- El comando `IF NOT EXISTS` asegura que no haya error si las columnas ya existen
- Las columnas son opcionales (`NULL` permitido), por lo que las propuestas existentes no se verán afectadas
- Una vez ejecutado, el código de la aplicación funcionará automáticamente con estas columnas

## 🚨 Si Ocurre un Error

Si ves un error al ejecutar el SQL:

1. **Error de permisos**: Asegúrate de estar usando el SQL Editor (no necesitas permisos especiales)
2. **Error de sintaxis**: Copia el SQL exactamente como está, sin modificaciones
3. **Tabla no existe**: Verifica que la tabla `propuestas` existe en tu base de datos

## 📞 Siguiente Paso

Una vez ejecutado el SQL, la aplicación funcionará completamente con:
- ✅ Edición de propuestas
- ✅ Agregar/quitar adjuntos
- ✅ Modificar valores y especificaciones
- ✅ Subir archivos al bucket de Supabase Storage

