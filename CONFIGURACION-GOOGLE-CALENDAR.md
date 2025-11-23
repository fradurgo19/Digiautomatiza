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

### 2.1 Obtener el email de la Service Account

1. Abre el archivo JSON que descargaste en el Paso 1
2. Busca el campo `"client_email"`
3. Copia el valor completo (ejemplo: `digiautomatiza-calendar@proyecto-123.iam.gserviceaccount.com`)
4. Guárdalo en un lugar seguro, lo necesitarás en el siguiente paso

### 2.2 Compartir el calendario (Método 1: Desde la barra lateral)

1. Ve a [Google Calendar](https://calendar.google.com/)
2. Asegúrate de estar logueado con la cuenta **digiautomatiza1@gmail.com**
3. En la barra lateral izquierda, busca la sección **"Mis calendarios"**
4. Encuentra el calendario que quieres compartir (generalmente es tu calendario principal)
5. **Pasa el cursor sobre el nombre del calendario** (no hagas clic todavía)
6. Verás que aparecen **3 puntos verticales (⋮)** a la derecha del nombre
7. Haz clic en esos **3 puntos**
8. En el menú desplegable, selecciona **"Configuración y uso compartido"** o **"Settings and sharing"**

### 2.3 Compartir el calendario (Método 2: Desde Configuración)

Si no encuentras los 3 puntos, prueba este método:

1. Ve a [Google Calendar](https://calendar.google.com/)
2. Haz clic en el **ícono de engranaje (⚙️)** en la esquina superior derecha
3. Selecciona **"Configuración"** o **"Settings"**
4. En la barra lateral izquierda, busca **"Configuración de calendarios"** o **"Settings for my calendars"**
5. Haz clic en el nombre del calendario que quieres compartir (generalmente es tu calendario principal)

### 2.4 Agregar la Service Account

Una vez que estés en la página de configuración del calendario:

1. Desplázate hacia abajo hasta encontrar la sección **"Compartir con personas específicas"** o **"Share with specific people"**
2. Haz clic en el botón **"Añadir personas"** o **"Add people"**
3. En el campo que aparece, **pega el email de la Service Account** que copiaste en el paso 2.1
4. A la derecha del campo de email, verás un menú desplegable de permisos
5. Selecciona **"Realizar cambios en eventos"** o **"Make changes to events"**
   - ⚠️ **IMPORTANTE**: Debe ser este permiso específico, no "Ver todos los detalles" ni "Ver solo libre/ocupado"
6. Haz clic en **"Enviar"** o **"Send"**

### 2.5 Verificar que se compartió correctamente

1. Después de hacer clic en "Enviar", deberías ver el email de la Service Account en la lista de "Compartir con personas específicas"
2. Verifica que el permiso sea **"Realizar cambios en eventos"** o **"Make changes to events"**
3. Si todo está correcto, ya puedes continuar con el siguiente paso

### ⚠️ Nota importante

- La Service Account **NO recibirá un email** de invitación (esto es normal)
- El acceso se otorga inmediatamente después de hacer clic en "Enviar"
- Si no ves la opción "Compartir con personas específicas", asegúrate de estar en la configuración del calendario correcto

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

