# Instrucciones para Agregar Columna eventoId a Sesiones

## Problema Resuelto
Al modificar una sesión en el módulo de Sesiones, el evento en Google Calendar no se actualizaba, manteniendo la fecha inicial. Ahora las sesiones se sincronizan automáticamente con Google Calendar.

## Pasos para Ejecutar

### 1. Ejecutar SQL en Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `supabase-sesiones-evento-id.sql`
4. Ejecuta el script

El script agregará:
- Columna `eventoId` a la tabla `sesiones`
- Índice para mejorar búsquedas por `eventoId`

### 2. Verificar la Migración

Después de ejecutar el SQL, verifica que la columna se haya creado correctamente:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sesiones' AND column_name = 'eventoId';
```

Deberías ver una fila con `eventoId` y tipo `text`.

## Funcionalidades Implementadas

### ✅ Creación de Sesiones
- Cuando se crea una sesión con "Crear evento en Google Calendar" activado:
  - Se crea el evento en Google Calendar
  - Se guarda el `eventoId` en la base de datos
  - Se guarda el enlace de Google Meet si se genera

### ✅ Actualización de Sesiones
- Cuando se modifica una sesión que tiene un `eventoId`:
  - Se actualiza automáticamente el evento en Google Calendar
  - Se actualiza la fecha, hora, título, descripción
  - Se preserva el enlace de Google Meet existente

### ✅ Eliminación de Sesiones
- Cuando se elimina una sesión que tiene un `eventoId`:
  - Se elimina automáticamente el evento en Google Calendar
  - Se elimina la sesión de la base de datos

## Notas Importantes

⚠️ **Sesiones Existentes**: Las sesiones creadas antes de ejecutar este SQL no tendrán `eventoId`. Para esas sesiones:
- Si se actualizan, NO se actualizará el evento en Google Calendar (porque no tienen `eventoId`)
- Si se eliminan, NO se eliminará el evento en Google Calendar
- Las nuevas sesiones creadas después de ejecutar el SQL funcionarán correctamente

💡 **Recomendación**: Si tienes sesiones importantes con eventos en Google Calendar, considera:
1. Eliminar manualmente los eventos antiguos en Google Calendar
2. O crear nuevas sesiones para reemplazarlas (esto creará nuevos eventos con `eventoId`)

## Próximos Pasos

1. ✅ Ejecutar el SQL en Supabase
2. ✅ Verificar que la columna se haya creado
3. ✅ Probar creando una nueva sesión con "Crear evento en Google Calendar"
4. ✅ Probar modificando la fecha de una sesión y verificar que se actualice en Google Calendar
5. ✅ Verificar en el módulo de Calendario que la fecha se haya actualizado correctamente

## Solución Técnica

La solución implementa:
- **Campo `eventoId`**: Vincula cada sesión con su evento en Google Calendar
- **Sincronización bidireccional**: Los cambios en sesiones se reflejan en Google Calendar
- **Preservación de datos**: Se mantiene el enlace de Google Meet al actualizar
- **Manejo de errores**: Si falla la actualización en Google Calendar, la sesión se actualiza igualmente en la base de datos

