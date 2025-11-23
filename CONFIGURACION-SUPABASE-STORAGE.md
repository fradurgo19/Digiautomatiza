# 📦 Configuración de Supabase Storage para Propuestas

Este documento explica cómo configurar Supabase Storage para almacenar los archivos adjuntos de las propuestas.

## 🎯 Pasos de Configuración

### 1. Crear el Bucket en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"**
4. Configura el bucket:
   - **Name**: `propuestas`
   - **Public bucket**: ✅ **Marcar como público** (para que las URLs sean accesibles)
   - **File size limit**: `10 MB` (o el límite que prefieras)
   - **Allowed MIME types**: 
     - `image/*` (para imágenes)
     - `application/pdf` (para PDFs)
     - `application/msword` (para Word .doc)
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (para Word .docx)
     - `application/vnd.ms-excel` (para Excel .xls)
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (para Excel .xlsx)

5. Haz clic en **"Create bucket"**

### 2. Configurar Políticas de Seguridad (RLS)

Para que los usuarios puedan subir archivos, necesitas configurar las políticas:

1. Ve a **Storage** → **Policies** → Selecciona el bucket `propuestas`
2. Haz clic en **"New Policy"**
3. Crea una política para **INSERT** (subir archivos):
   - **Policy name**: `Allow authenticated users to upload`
   - **Allowed operation**: `INSERT`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'propuestas'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - O si quieres permitir a todos (menos seguro pero más simple para desarrollo):
     ```sql
     bucket_id = 'propuestas'::text
     ```

4. Crea una política para **SELECT** (leer archivos):
   - **Policy name**: `Allow public read access`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: 
     ```sql
     bucket_id = 'propuestas'::text
     ```

5. (Opcional) Crea una política para **DELETE** (eliminar archivos):
   - **Policy name**: `Allow authenticated users to delete`
   - **Allowed operation**: `DELETE`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'propuestas'::text) AND (auth.role() = 'authenticated'::text)
     ```

### 3. Configurar Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env` y en Vercel:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

**Para obtener estas credenciales:**
1. Ve a **Settings** → **API** en tu proyecto de Supabase
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 4. Actualizar la Base de Datos

Ejecuta el script SQL `supabase-propuestas-update.sql` en el SQL Editor de Supabase para agregar las columnas `especificaciones` y `adjuntos` a la tabla `propuestas`.

## ✅ Verificación

1. Intenta crear una nueva propuesta en la aplicación
2. Sube un archivo (imagen o documento)
3. Verifica que el archivo aparezca en:
   - El formulario (lista de adjuntos)
   - La vista previa de la propuesta
   - El PDF exportado

## 🔒 Seguridad

- **En producción**: Usa políticas RLS más restrictivas que requieran autenticación
- **Límites de tamaño**: Configura límites apropiados según tus necesidades
- **Tipos de archivo**: Limita los tipos MIME permitidos para evitar subir archivos maliciosos
- **Validación**: El código ya valida tipos y tamaños en el frontend, pero también deberías validar en el backend

## 📝 Notas

- Los archivos se almacenan en la ruta: `propuestas/{timestamp}-{random}.{extension}`
- Las URLs públicas se generan automáticamente por Supabase
- Los archivos se pueden eliminar desde la aplicación (si configuraste la política DELETE)

