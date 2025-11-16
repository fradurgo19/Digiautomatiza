# 📱 Guía Completa de WhatsApp - Digiautomatiza

Documentación completa para configurar y usar el envío masivo de mensajes de WhatsApp.

---

## 🎯 Opciones Disponibles

El sistema soporta **4 métodos** de envío de WhatsApp:

| Método | Mejor para | Costo | Dificultad | Archivos |
|--------|------------|-------|------------|----------|
| **Demo** | Desarrollo y pruebas | Gratis | Muy fácil | ❌ |
| **Twilio** | Producción pequeña/mediana | Pago por mensaje | Fácil | ✅ |
| **Meta Cloud** | Producción grande | Gratis hasta 1,000/mes | Media | ✅ |
| **Backend** | Personalizado | Variable | Avanzada | ✅ |

---

## 🚀 Opción 1: Modo DEMO (Predeterminado)

### ✅ Ventajas
- No requiere configuración
- Gratis
- Perfecto para desarrollo
- Simula envíos reales

### ❌ Limitaciones
- **NO envía mensajes reales**
- Solo para pruebas

### Configuración
Ya está configurado por defecto. No necesitas hacer nada.

---

## 💼 Opción 2: Twilio WhatsApp API (Recomendado)

### ✅ Ventajas
- Fácil de configurar
- Muy confiable
- Soporte 24/7
- Documentación excelente
- Soporta multimedia

### ❌ Desventajas
- Costo por mensaje (~$0.005 USD)
- Requiere aprobación de número
- Los usuarios deben optar por recibir mensajes primero

### 📋 Paso 1: Crear Cuenta en Twilio

1. Ve a https://www.twilio.com/try-twilio
2. Regístrate con tu email
3. Verifica tu número de teléfono
4. Recibirás $15 USD de crédito gratis

### 📋 Paso 2: Configurar WhatsApp

1. En el Dashboard de Twilio, ve a **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Sigue el tutorial para configurar tu **WhatsApp Sandbox**
3. Para activarte como receptor, envía el código que te dan al número de Twilio

### 📋 Paso 3: Obtener Credenciales

1. En el Dashboard, ve a **Account** > **API keys & tokens**
2. Copia tu **Account SID**
3. Copia tu **Auth Token** (haz clic en "show")
4. Copia tu **WhatsApp Phone Number** (ej: +14155238886)

### 📋 Paso 4: Configurar en Digiautomatiza

1. Crea un archivo `.env` en la raíz del proyecto (copia de `.env.example`)
2. Agrega tus credenciales:

```env
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=tu_auth_token_aqui
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

3. Abre `src/services/whatsappService.ts`
4. Cambia la línea 15 a:

```typescript
const WHATSAPP_PROVIDER: WhatsAppProvider = 'twilio';
```

5. Reinicia el servidor de desarrollo:

```bash
npm run dev
```

### 📋 Paso 5: Probar

1. Para que un número pueda recibir mensajes de prueba, debe:
   - Enviar un WhatsApp al número de Twilio con el código proporcionado
   - Ejemplo: "join [tu-código-sandbox]"

2. Una vez configurado, usa la aplicación para enviar mensajes

### 💰 Costos

**Modo Sandbox (Pruebas):**
- Gratis con tu crédito inicial
- Limitado a números que opt-in

**Modo Producción:**
- $0.005 USD por mensaje enviado
- Requiere número de WhatsApp Business aprobado

### 📚 Documentación Oficial
https://www.twilio.com/docs/whatsapp/api

---

## 🌐 Opción 3: Meta Cloud API (WhatsApp Business)

### ✅ Ventajas
- **1,000 mensajes gratis al mes**
- API oficial de WhatsApp
- Sin costo adicional hasta 1,000 conversaciones
- Soporta multimedia

### ❌ Desventajas
- Configuración más compleja
- Requiere Facebook Business Manager
- Requiere verificación de negocio
- Proceso de aprobación más largo

### 📋 Paso 1: Crear Cuenta Business

1. Ve a https://business.facebook.com
2. Crea una cuenta de Facebook Business
3. Verifica tu negocio

### 📋 Paso 2: Configurar WhatsApp

1. Ve a https://developers.facebook.com/apps
2. Crea una nueva App
3. Selecciona **Business** como tipo
4. Agrega el producto **WhatsApp**
5. Configura tu número de teléfono

### 📋 Paso 3: Obtener Credenciales

1. En la app, ve a **WhatsApp** > **API Setup**
2. Copia tu **Phone Number ID**
3. Genera un **Access Token**:
   - Válido para 24 horas (desarrollo)
   - O crea un token permanente

### 📋 Paso 4: Configurar en Digiautomatiza

1. Edita tu archivo `.env`:

```env
VITE_META_ACCESS_TOKEN=tu_access_token_aqui
VITE_META_PHONE_NUMBER_ID=123456789012345
```

2. En `src/services/whatsappService.ts` línea 15:

```typescript
const WHATSAPP_PROVIDER: WhatsAppProvider = 'meta';
```

3. Reinicia el servidor

### 💰 Costos

**Primeras 1,000 conversaciones/mes:** Gratis  
**Después de 1,000:**
- Conversaciones de servicio: $0.005 - $0.03 USD
- Conversaciones de marketing: $0.02 - $0.15 USD

### 📚 Documentación Oficial
https://developers.facebook.com/docs/whatsapp/cloud-api

---

## 🛠️ Opción 4: Backend Personalizado

### ✅ Ventajas
- Control total
- Puedes usar cualquier proveedor
- Lógica personalizada

### ❌ Desventajas
- Requiere desarrollo backend
- Mantenimiento adicional

### 📋 Configuración

1. Crea un endpoint en tu backend:

```javascript
// Ejemplo con Node.js + Express
app.post('/api/whatsapp/enviar-masivo', async (req, res) => {
  const { numeros, mensaje, archivos } = req.body;
  
  // Tu lógica aquí (Twilio, Meta, etc.)
  
  res.json({
    exitosos: ['números exitosos'],
    fallidos: [{ numero: '+57xxx', error: 'descripción' }]
  });
});
```

2. Configura la URL en `.env`:

```env
VITE_BACKEND_URL=https://tu-api.com
```

3. Cambia el proveedor:

```typescript
const WHATSAPP_PROVIDER: WhatsAppProvider = 'backend';
```

---

## 🔧 Validación de Números

El sistema incluye validación automática de números:

### Formato Correcto

✅ `+573001234567` (Formato internacional)  
✅ `+57 300 123 4567` (Con espacios)  
✅ `+57 (300) 123-4567` (Con paréntesis y guiones)  

### Formato Incorrecto

❌ `3001234567` (Sin código de país)  
❌ `0300123456 7` (Formato local)  

El sistema automáticamente:
- Formatea números al estándar E.164
- Valida antes de enviar
- Reporta números inválidos

---

## 📤 Envío de Archivos Multimedia

### Tipos Soportados

| Tipo | Formatos | Tamaño Máximo |
|------|----------|---------------|
| Imágenes | JPG, PNG, GIF | 5 MB |
| Videos | MP4, 3GP | 16 MB |
| Audios | MP3, AAC, OGG | 16 MB |
| Documentos | PDF, DOC, XLS | 100 MB |

### Importante

- **Twilio:** Los archivos deben estar en una URL pública
- **Meta:** Primero se suben, luego se envían
- **Backend:** Depende de tu implementación

---

## 🧪 Modo de Prueba (Testing)

Actualmente el sistema está en **modo DEMO**. Para probarlo:

1. Agrega algunos clientes de prueba
2. Selecciónalos con los checkboxes
3. Haz clic en **"💬 Envío Masivo WhatsApp"**
4. Escribe un mensaje de prueba
5. Envía

Verás en la consola del navegador (F12):
```
=== MODO DEMO - WhatsApp ===
Números destinatarios: ["+573001234567", ...]
Mensaje: "Tu mensaje aquí"
Archivos: 0
Exitosos: 2
Fallidos: 0
```

---

## 🚨 Solución de Problemas

### Error: "Configura VITE_TWILIO_ACCOUNT_SID..."

**Problema:** Variables de entorno no configuradas  
**Solución:**
1. Verifica que exista el archivo `.env`
2. Verifica que las variables comiencen con `VITE_`
3. Reinicia el servidor (`npm run dev`)

### Error: "Número inválido"

**Problema:** Formato de número incorrecto  
**Solución:**
- Usa formato internacional: `+[código país][número]`
- Ejemplo Colombia: `+573001234567`
- No uses ceros iniciales después del código de país

### Los mensajes no llegan (Twilio)

**Problema:** Número no opt-in al sandbox  
**Solución:**
1. El destinatario debe enviar un WhatsApp al número de Twilio
2. Mensaje: `join [código-sandbox]`
3. Recibirá confirmación
4. Ahora puede recibir mensajes

### Error: "Authorization failed"

**Problema:** Credenciales incorrectas  
**Solución:**
1. Verifica Account SID y Auth Token
2. Cópialos directamente desde Twilio Console
3. No incluyas espacios adicionales

---

## 📊 Límites y Restricciones

### Twilio Sandbox (Pruebas)
- ✅ Mensajes ilimitados
- ❌ Solo a números opt-in
- ❌ No para producción

### Twilio Producción
- ✅ Sin límite de mensajes
- ✅ A cualquier número
- 💰 Pago por mensaje

### Meta Cloud API
- ✅ 1,000 conversaciones gratis/mes
- ✅ Envíos ilimitados dentro de conversaciones
- ⚠️ Requiere opt-in del usuario

---

## 🎯 Mejores Prácticas

### 1. Opt-In (Consentimiento)

**Importante:** Antes de enviar WhatsApp masivo:
- ✅ El cliente debe dar su consentimiento
- ✅ Guarda evidencia del opt-in
- ✅ Proporciona opción de opt-out

### 2. Contenido

- ✅ Mensajes personalizados
- ✅ Información relevante
- ❌ No spam
- ❌ No cadenas

### 3. Frecuencia

- ✅ Respetar horarios (9am - 8pm)
- ✅ No enviar diario
- ✅ Máximo 2-3 veces por semana

### 4. Respuestas

- ✅ Monitorear respuestas
- ✅ Responder rápido
- ✅ Ser profesional

---

## 📈 Monitoreo y Analytics

### Métricas Importantes

- **Tasa de entrega:** % mensajes entregados
- **Tasa de lectura:** % mensajes leídos
- **Tasa de respuesta:** % que responden
- **Tasa de opt-out:** % que se dan de baja

### Twilio Dashboard

1. Ve a **Monitor** > **Logs** > **Messages**
2. Filtra por WhatsApp
3. Ve detalles de cada envío

### Meta Business

1. Ve a **WhatsApp Manager**
2. Sección **Insights**
3. Analiza métricas

---

## 🔄 Migración de Modo Demo a Producción

### Checklist

- [ ] Crear cuenta en Twilio o Meta
- [ ] Obtener credenciales
- [ ] Configurar variables de entorno
- [ ] Cambiar `WHATSAPP_PROVIDER` en el código
- [ ] Probar con números de prueba
- [ ] Verificar opt-ins de clientes
- [ ] Documentar proceso
- [ ] Entrenar equipo comercial
- [ ] Monitorear primeros envíos

---

## 💡 Casos de Uso

### 1. Ofertas y Promociones

```
🎉 ¡Oferta Especial Digiautomatiza!

Hola [Nombre],

Este mes tenemos 20% OFF en desarrollo de aplicaciones web con React.

¿Te interesa? Responde SÍ y te enviamos más info.

Saludos,
Equipo Digiautomatiza
```

### 2. Seguimiento

```
Hola [Nombre],

Te contactamos hace unos días sobre nuestros servicios de automatización.

¿Tuviste tiempo de revisarlos?

Podemos agendar una llamada cuando gustes.

Responde o llámanos al +57 300 123 4567
```

### 3. Recordatorio de Sesión

```
📅 Recordatorio de Sesión

Hola [Nombre],

Te recordamos tu sesión programada:

🗓️ Fecha: 25 de Octubre
⏰ Hora: 3:00 PM
🔗 Link: https://meet.google.com/xxx

¡Te esperamos!
```

---

## 📞 Soporte

### Twilio Support
- https://support.twilio.com
- Chat en vivo 24/7

### Meta Support
- https://developers.facebook.com/support
- Comunidad: https://developers.facebook.com/community

### Digiautomatiza
- Email: digiautomatiza@outlook.com
- Ver documentación en este proyecto

---

## 🎓 Recursos Adicionales

### Tutoriales en Video

**Twilio:**
- https://www.youtube.com/watch?v=example (Twilio WhatsApp Tutorial)

**Meta:**
- https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

### Comunidades

- r/twilio en Reddit
- Stack Overflow (tag: twilio-whatsapp)
- Facebook Developer Circle

---

## ✅ Resumen Rápido

### Para Empezar HOY (Demo)
Ya está funcionando. Solo usa la aplicación.

### Para Producción en 1 Hora (Twilio)
1. Cuenta Twilio → 5 min
2. Configurar sandbox → 5 min
3. Copiar credenciales → 2 min
4. Configurar `.env` → 2 min
5. Cambiar código → 1 min
6. Probar → 5 min

### Para Producción Escalable (Meta)
1. Facebook Business → 20 min
2. Crear App → 10 min
3. Configurar WhatsApp → 15 min
4. Obtener credenciales → 10 min
5. Configurar código → 5 min
6. Probar → 10 min

---

¡Ya estás listo para enviar mensajes de WhatsApp masivos con Digiautomatiza! 🚀📱

*Última actualización: Octubre 2025*

