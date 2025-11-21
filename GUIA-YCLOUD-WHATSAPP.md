# 📱 Guía de Configuración: WhatsApp Masivo con YCloud

Esta guía te ayudará a configurar el envío masivo de WhatsApp usando YCloud API.

## 🚀 Pasos de Configuración

### 1. Crear cuenta en YCloud

1. Visita [YCloud](https://www.ycloud.com)
2. Crea una cuenta
3. Accede al panel de control

### 2. Obtener credenciales de API

1. En el panel de YCloud, ve a **Settings** → **API**
2. Genera o copia tu **API Key**
3. Anota tu **número de WhatsApp Business** (formato: `+1234567890`)

### 3. Configurar variables de entorno en Vercel (Producción)

Como tu aplicación ya está desplegada en Vercel, solo necesitas agregar las variables de entorno:

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **Digiautomatiza**
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables (una por una):

   **Variable 1:**
   - Key: `YCLOUD_API_KEY`
   - Value: `be2f369c4c53ca0d4fdafb5d3f4b744d`
   - Environment: `Production`, `Preview`, `Development` (selecciona todos)
   - Click en **Save**

   **Variable 2:**
   - Key: `YCLOUD_WHATSAPP_NUMBER`
   - Value: `+15558366820`
   - Environment: `Production`, `Preview`, `Development` (selecciona todos)
   - Click en **Save**

   **Variable 3 (Opcional):**
   - Key: `YCLOUD_API_URL`
   - Value: `https://api.ycloud.com/v2/whatsapp/messages`
   - Environment: `Production`, `Preview`, `Development` (selecciona todos)
   - Click en **Save**

**⚠️ IMPORTANTE:** Después de agregar las variables:
1. Ve a **Deployments**
2. Encuentra el último deployment
3. Haz clic en los **3 puntos** (⋯) → **Redeploy**
4. Espera a que termine el redeploy

**Nota:** El redeploy es necesario porque las variables de entorno solo se cargan cuando se construye el proyecto.

### 4. Configurar variables de entorno local (desarrollo - opcional)

Si quieres probar localmente, crea o actualiza tu archivo `.env` en la raíz del proyecto:

```env
# YCloud WhatsApp API
YCLOUD_API_KEY=be2f369c4c53ca0d4fdafb5d3f4b744d
YCLOUD_WHATSAPP_NUMBER=+15558366820
YCLOUD_API_URL=https://api.ycloud.com/v2/whatsapp/messages

# Backend URL (para desarrollo local)
VITE_BACKEND_URL=http://localhost:3000
```

**Nota:** 
- El archivo `.env` no debe subirse a Git. Ya está incluido en `.gitignore`.
- Para desarrollo local, necesitarías ejecutar el backend con `npm run api:dev` o similar.
- En producción (Vercel), las variables se configuran desde el dashboard.

### 5. Verificar configuración

El servicio ya está configurado para usar el backend por defecto. El proveedor está configurado como `'backend'` en `src/services/whatsappService.ts`.

## 📋 Uso

### Desde la interfaz

1. Ve a **Gestión de Clientes**
2. Selecciona los clientes a los que deseas enviar mensajes
3. Haz clic en **Enviar WhatsApp Masivo**
4. Escribe tu mensaje
5. (Opcional) Adjunta archivos (imágenes, videos, documentos, audio)
6. Haz clic en **Enviar**

### Desde el código

```typescript
import { enviarWhatsAppMasivo } from './services/whatsappService';

const resultado = await enviarWhatsAppMasivo({
  numeros: ['+1234567890', '+0987654321'],
  mensaje: 'Hola, este es un mensaje de prueba',
  archivos: [] // Opcional
});

console.log('Exitosos:', resultado.exitosos);
console.log('Fallidos:', resultado.fallidos);
```

## 🔧 Endpoint del Backend

El endpoint está disponible en:
- **Producción:** `https://tu-dominio.vercel.app/api/whatsapp/enviar-masivo`
- **Desarrollo:** `http://localhost:3000/api/whatsapp/enviar-masivo`

### Formato de la petición

```json
{
  "numeros": ["+1234567890", "+0987654321"],
  "mensaje": "Tu mensaje aquí",
  "archivos": [
    {
      "url": "https://ejemplo.com/imagen.jpg",
      "type": "image"
    }
  ]
}
```

### Formato de la respuesta

```json
{
  "exitosos": ["+1234567890"],
  "fallidos": [
    {
      "numero": "+0987654321",
      "error": "Número inválido"
    }
  ],
  "total": 2,
  "exitososCount": 1,
  "fallidosCount": 1
}
```

## 📎 Envío de Archivos

Para enviar archivos con YCloud:

1. **Sube el archivo a un servidor público** (Cloudinary, AWS S3, etc.)
2. Obtén la URL pública del archivo
3. Pasa el archivo en el formato:

```typescript
{
  numeros: ['+1234567890'],
  mensaje: 'Mira esta imagen',
  archivos: [
    {
      url: 'https://ejemplo.com/imagen.jpg',
      type: 'image' // 'image', 'video', 'document', 'audio'
    }
  ]
}
```

**Tipos de archivo soportados:**
- `image` - Imágenes (JPG, PNG, GIF)
- `video` - Videos (MP4, 3GP)
- `document` - Documentos (PDF, DOC, XLS, etc.)
- `audio` - Audios (MP3, OGG, AMR)

## ⚠️ Consideraciones Importantes

### Límites de Rate

- YCloud tiene límites de rate limiting
- El código incluye un delay de 100ms entre mensajes para evitar problemas
- Para envíos masivos grandes, considera procesar en lotes

### Plantillas de WhatsApp ⚠️ IMPORTANTE

**Problema común: Los mensajes se marcan como exitosos pero no llegan**

Esto sucede porque WhatsApp tiene restricciones estrictas:

1. **Ventana de 24 horas**: Los mensajes de texto libre solo funcionan dentro de 24 horas después de que el usuario te escriba por última vez
2. **Fuera de la ventana**: Si el usuario no te ha escrito en las últimas 24 horas, DEBES usar una plantilla aprobada
3. **Plantillas requeridas**: Para envío masivo, siempre debes usar plantillas aprobadas por WhatsApp

**Solución:**
- Crea y aprueba plantillas en el panel de YCloud antes de enviar masivamente
- Usa el parámetro `template` en lugar de `text` cuando envíes fuera de la ventana de 24 horas
- Verifica el estado del número de WhatsApp Business en YCloud (debe estar "Connected" o "Verified")

### Costos

- YCloud cobra por conversación según el país del destinatario
- Revisa los precios en [YCloud Pricing](https://www.ycloud.com/pricing)

### Políticas de WhatsApp

- ✅ Obtén consentimiento antes de enviar mensajes
- ✅ Proporciona opción de opt-out
- ✅ No envíes spam
- ✅ Respeta las políticas de WhatsApp Business

## 🐛 Solución de Problemas

### Error: "YCLOUD_API_KEY no configurada"

**Solución:** Verifica que hayas agregado la variable de entorno en Vercel y que hayas hecho redeploy.

### Error: "Error al enviar a +1234567890"

**Posibles causas:**
- Número inválido o no registrado en WhatsApp
- Plantilla no aprobada (si usas plantillas)
- Límite de rate excedido
- Créditos insuficientes en YCloud

**Solución:** Revisa los logs del backend en Vercel para más detalles.

### Los mensajes no se envían

**Verifica:**
1. Que las variables de entorno estén configuradas correctamente
2. Que el número de WhatsApp Business esté activo en YCloud
3. Que tengas créditos suficientes
4. Que los números de destino estén en formato internacional (+código_país+número)

### ⚠️ Mensaje marcado como exitoso pero no llega al cliente

**Este es el problema más común.** La API responde con éxito (200 OK) pero el mensaje no se entrega.

**Causas principales:**

1. **Ventana de 24 horas cerrada** (MÁS COMÚN)
   - WhatsApp solo permite mensajes de texto libre dentro de 24 horas después de que el usuario te escriba
   - Si el usuario no te ha escrito en las últimas 24 horas, el mensaje se rechaza silenciosamente
   - **Solución:** Usa plantillas aprobadas para mensajes fuera de la ventana

2. **Número de WhatsApp Business no verificado**
   - El número debe estar "Connected" o "Verified" en el panel de YCloud
   - **Solución:** Ve a YCloud Dashboard → WhatsApp → Verifica el estado de tu número

3. **Número de destino no tiene WhatsApp**
   - El número debe estar registrado en WhatsApp
   - **Solución:** Verifica que el número tenga WhatsApp activo

4. **Falta de créditos en YCloud**
   - Aunque la API acepta la solicitud, si no hay créditos, no se envía
   - **Solución:** Verifica tu balance en YCloud Dashboard

**Cómo verificar en los logs de Vercel:**
1. Ve a Vercel Dashboard → Tu proyecto → Deployments
2. Abre el último deployment → Logs
3. Busca las líneas que dicen `📥 Respuesta de YCloud` (respuesta inmediata de la API)
4. Busca las líneas que dicen `📥 Webhook recibido de YCloud` (actualizaciones de estado)
5. Revisa el campo `status` en la respuesta - debería ser `sent`, `delivered`, etc.
6. Si el status es `failed` o `rejected`, revisa el mensaje de error

**Con webhooks configurados, verás:**
- `📊 Estado del mensaje actualizado` - Cuando el estado cambia (sent → delivered → read)
- `❌ Mensaje fallido` - Si el mensaje no se pudo entregar (con el motivo)
- `✅ Mensaje entregado` - Confirmación de entrega
- `👁️ Mensaje leído` - Cuando el cliente lee el mensaje

**Solución inmediata:**
- Para envío masivo, SIEMPRE usa plantillas aprobadas
- Crea una plantilla en YCloud Dashboard → Templates
- Espera la aprobación de WhatsApp (puede tomar horas o días)
- Modifica el código para usar plantillas en lugar de texto libre

### ✅ Problema Confirmado: Ventana de 24 Horas

**Error detectado en los logs:**
```
Error Code: 131047
Error Message: "Message failed to send because more than 24 hours have passed since the customer last replied to this number."
```

**Esto significa:**
- ✅ El webhook está funcionando correctamente
- ✅ YCloud aceptó el mensaje
- ❌ WhatsApp rechazó el mensaje porque la ventana de 24 horas está cerrada
- ⚠️ **Solución:** Debes usar plantillas aprobadas para enviar mensajes fuera de la ventana de 24 horas

## 📚 Recursos Adicionales

- [Documentación oficial de YCloud](https://docs.ycloud.com)
- [Guía de envío de mensajes](https://docs.ycloud.com/reference/whatsapp-message-sending-guide)
- [API Reference](https://docs.ycloud.com/reference)

## ✅ Checklist de Configuración

- [x] Aplicación desplegada en Vercel ✅
- [x] Base de datos en Supabase ✅
- [x] API Key obtenida: `be2f369c4c53ca0d4fdafb5d3f4b744d`
- [x] Número de WhatsApp Business configurado: `+15558366820`
- [x] **Webhook configurado:** `https://www.digiautomatiza.co/api/whatsapp/webhook` (ID: `691fce65bc05db477e0587bf`) ✅
- [ ] **Variables de entorno agregadas en Vercel** (Settings → Environment Variables)
- [ ] **Redeploy realizado en Vercel** (Deployments → Redeploy)
- [ ] **Webhook verificado** - Enviar mensaje de prueba y revisar logs
- [ ] Prueba de envío realizada con éxito

## 🔑 Credenciales Listas para Configurar

**API Key:** `be2f369c4c53ca0d4fdafb5d3f4b744d`  
**Número WhatsApp:** `+15558366820`

### Pasos Rápidos (Ya tienes todo listo, solo falta configurar):

1. ✅ **Ve a Vercel Dashboard** → Tu proyecto
2. ✅ **Settings** → **Environment Variables**
3. ✅ Agrega las 3 variables (ver sección 3 arriba)
4. ✅ **Deployments** → **Redeploy** (último deployment)
5. ✅ **¡Listo!** Prueba enviando un WhatsApp desde la interfaz

**Tiempo estimado:** 2-3 minutos

---

## 🔔 Configurar Webhooks (Recomendado)

Los webhooks te permiten recibir actualizaciones en tiempo real sobre el estado de tus mensajes (enviado, entregado, leído, fallido).

### Paso 1: Crear el endpoint de webhook en YCloud

1. Ve a [YCloud Dashboard](https://dashboard.ycloud.com) → **Developers** → **Webhooks**
2. Haz clic en **Create Webhook**
3. Configura:
   - **URL:** `https://www.digiautomatiza.co/api/whatsapp/webhook`
   - **Enabled Events:** Selecciona los siguientes eventos (los más importantes):
     - ✅ `whatsapp.message.updated` - **ESENCIAL** - Estado de mensajes (sent, delivered, read, failed)
     - ✅ `whatsapp.inbound_message.received` - Mensajes entrantes de clientes
     - ✅ `whatsapp.phone_number.quality_updated` - Calidad del número (importante para evitar bloqueos)
     - ✅ `whatsapp.template.reviewed` - Estado de plantillas (aprobadas/rechazadas)
     - ⚪ `whatsapp.business_account.updated` - (Opcional) Cambios en la cuenta
     - ⚪ `whatsapp.phone_number.name_updated` - (Opcional) Cambios en el nombre
   - **Status:** `active`
   - **Description:** "Webhook para recibir actualizaciones de mensajes WhatsApp"
4. Guarda el webhook
5. **Copia el Secret** - lo necesitarás para verificar las firmas (opcional pero recomendado)

**Eventos recomendados (mínimo):**
- `whatsapp.message.updated` - Para saber si los mensajes se entregaron o fallaron
- `whatsapp.inbound_message.received` - Para recibir respuestas de clientes

### Paso 2: Verificar que el webhook funciona

**Tu webhook ya está configurado:**
- **URL:** `https://www.digiautomatiza.co/api/whatsapp/webhook`
- **ID:** `691fce65bc05db477e0587bf`

**Para verificar que funciona:**

1. **Envía un mensaje de prueba** desde la aplicación (Gestión de Clientes → Enviar WhatsApp Masivo)
2. **Ve a los logs de Vercel:**
   - Vercel Dashboard → Tu proyecto → Deployments
   - Abre el último deployment → **Logs**
3. **Busca estas líneas en los logs:**
   ```
   📥 Webhook recibido de YCloud
   📊 Estado del mensaje actualizado: { status: 'sent', ... }
   ✅ Mensaje entregado - ID: xxx, Para: +57xxx
   ```
4. **Si no ves webhooks:**
   - Verifica que el webhook esté en estado `active` en YCloud Dashboard
   - Verifica que los eventos estén habilitados (`whatsapp.message.updated`)
   - Espera unos segundos después de enviar (los webhooks pueden tardar)

**Eventos que deberías recibir:**
- `whatsapp.message.updated` con status: `accepted` → `sent` → `delivered` (o `failed`)
- Si el mensaje falla, verás `❌ Mensaje fallido` con el motivo

### Beneficios de los webhooks

- ✅ Saber el estado real de cada mensaje (sent, delivered, read, failed)
- ✅ Detectar problemas inmediatamente
- ✅ Registrar estadísticas de entrega
- ✅ Notificar a usuarios cuando un mensaje falla

---

## 📋 Formato de Mensajes con Plantillas

Para enviar mensajes fuera de la ventana de 24 horas, debes usar plantillas aprobadas.

### Crear una plantilla en YCloud

1. Ve a YCloud Dashboard → **WhatsApp** → **Templates**
2. Haz clic en **Create Template**
3. Completa:
   - **Name:** Nombre único (ej: "notificacion_cliente")
   - **Category:** `UTILITY` o `MARKETING`
   - **Language:** `es` (español)
   - **Content:** Tu mensaje con variables `{{1}}`, `{{2}}`, etc.
4. Envía para aprobación (puede tomar horas o días)

### Usar plantillas en el código

Actualmente el código envía mensajes de texto libre. Para usar plantillas, modifica el payload:

```javascript
// En lugar de:
{
  type: 'text',
  text: { body: mensaje }
}

// Usa:
{
  type: 'template',
  template: {
    name: 'notificacion_cliente', // Nombre de tu plantilla
    language: { code: 'es' },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: 'valor1' },
          { type: 'text', text: 'valor2' }
        ]
      }
    ]
  }
}
```

**Nota:** Esto requiere modificar `api/whatsapp/enviar-masivo.js` para soportar plantillas.

---

**¿Necesitas ayuda?** Revisa los logs en Vercel o contacta al soporte de YCloud.

