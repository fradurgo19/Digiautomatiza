# Configuración de Google Calendar Integration

## Paso 1: Crear Service Account en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Calendar API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Haz clic en "Enable"

4. Crea una **Service Account**:
   - Ve a "APIs & Services" > "Credentials"
   - Haz clic en "Create Credentials" > "Service Account"
   - Nombre: `digiautomatiza-calendar`
   - Descripción: `Service account para crear eventos en Google Calendar`
   - Haz clic en "Create and Continue"
   - Rol: No necesita rol especial, puedes saltar este paso
   - Haz clic en "Done"

5. Genera una clave JSON:
   - En la lista de Service Accounts, haz clic en la que acabas de crear
   - Ve a la pestaña "Keys"
   - Haz clic en "Add Key" > "Create new key"
   - Selecciona "JSON"
   - Descarga el archivo JSON

## Paso 2: Compartir el calendario con la Service Account

1. Abre el archivo JSON descargado
2. Copia el valor de `client_email` (ejemplo: `digiautomatiza-calendar@proyecto-123.iam.gserviceaccount.com`)
3. Ve a [Google Calendar](https://calendar.google.com/)
4. En el calendario de **digiautomatiza1@gmail.com**, haz clic en los 3 puntos > "Settings and sharing"
5. En "Share with specific people", haz clic en "Add people"
6. Pega el email de la Service Account
7. Permisos: Selecciona **"Make changes to events"**
8. Haz clic en "Send"

## Paso 3: Configurar variables de entorno en Vercel

Ve a tu proyecto en Vercel > Settings > Environment Variables y agrega:

### `GOOGLE_SERVICE_ACCOUNT_EMAIL`
Valor: El `client_email` del archivo JSON (ejemplo: `digiautomatiza-calendar@proyecto-123.iam.gserviceaccount.com`)

### `GOOGLE_PRIVATE_KEY`
Valor: El `private_key` completo del archivo JSON. **IMPORTANTE**: 
- Copia todo el contenido entre las comillas, incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
- Si el valor tiene `\n`, déjalo así (Vercel lo manejará correctamente)
- Ejemplo:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

### `GOOGLE_CALENDAR_ID` (Opcional)
Valor: `digiautomatiza1@gmail.com` (por defecto ya está configurado así)

## Paso 4: Verificar la integración

1. Despliega los cambios en Vercel
2. Ve a la página de Sesiones
3. Crea una nueva sesión
4. Marca el checkbox "📅 Crear evento en Google Calendar"
5. Guarda la sesión
6. Verifica en el calendario de digiautomatiza1@gmail.com que el evento se haya creado con el enlace de Google Meet

## Funcionalidades

- ✅ Crea eventos automáticamente en Google Calendar
- ✅ Genera enlaces de Google Meet automáticamente
- ✅ Invita al cliente por email si tiene email registrado
- ✅ Agrega recordatorios (1 día antes por email, 15 minutos antes por popup)
- ✅ Si se genera un enlace de Meet desde el calendario, se actualiza automáticamente en la sesión

## Troubleshooting

### Error: "Google Calendar no está configurado"
- Verifica que las variables de entorno estén configuradas en Vercel
- Asegúrate de haber hecho el redeploy después de agregar las variables

### Error: "Insufficient Permission" o "Forbidden"
- Verifica que hayas compartido el calendario con el email de la Service Account
- Verifica que el permiso sea "Make changes to events"

### Error: "Template not found" o errores de API
- Verifica que la Google Calendar API esté habilitada en Google Cloud Console
- Verifica que el Service Account tenga acceso al calendario

