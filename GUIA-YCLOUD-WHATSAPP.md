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

### Plantillas de WhatsApp

- Para mensajes masivos, WhatsApp requiere usar **plantillas aprobadas**
- Los mensajes de texto libre solo funcionan en ventanas de 24 horas después de que el usuario te escriba
- Crea y aprueba plantillas en el panel de YCloud antes de enviar masivamente

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

## 📚 Recursos Adicionales

- [Documentación oficial de YCloud](https://docs.ycloud.com)
- [Guía de envío de mensajes](https://docs.ycloud.com/reference/whatsapp-message-sending-guide)
- [API Reference](https://docs.ycloud.com/reference)

## ✅ Checklist de Configuración

- [x] Aplicación desplegada en Vercel ✅
- [x] Base de datos en Supabase ✅
- [x] API Key obtenida: `be2f369c4c53ca0d4fdafb5d3f4b744d`
- [x] Número de WhatsApp Business configurado: `+15558366820`
- [ ] **Variables de entorno agregadas en Vercel** (Settings → Environment Variables)
- [ ] **Redeploy realizado en Vercel** (Deployments → Redeploy)
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

**¿Necesitas ayuda?** Revisa los logs en Vercel o contacta al soporte de YCloud.

