# 📱 Configuración de YCloud WhatsApp Business API

## ✅ Estado Actual

Tu número de WhatsApp Business está configurado en YCloud:
- **Número:** +1 555 836 6820
- **Nombre visible:** Digiautomatiza
- **Estado:** Conectado ✅
- **Límite de mensajes:** 250 clientes

## 🔧 Paso 1: Obtener el Business ID

El `YCLOUD_WHATSAPP_BUSINESS_ID` **NO es el número de teléfono**. Es un ID único del canal que YCloud asigna.

### Cómo encontrarlo:

1. **Ve a tu panel de YCloud** (https://console.ycloud.com)
2. **Navega a:** WhatsApp > Canales / Channels
3. **Busca tu número:** +1 555 836 6820
4. **En la información del canal, busca uno de estos campos:**
   - `Business ID`
   - `Channel ID`
   - `WhatsApp Business ID`
   - `ID`

   **Ejemplo de lo que podrías ver:**
   ```
   ID: 12345678-1234-1234-1234-123456789abc
   o
   Business ID: 1234567890
   o
   Channel ID: ch_abc123xyz
   ```

5. **Copia ese ID** (puede ser un UUID, un número, o un string como `ch_xxx`)

---

## 📝 Paso 2: Actualizar el archivo `.env`

Abre el archivo `.env` en la **raíz del proyecto** y agrega/actualiza estas variables:

```env
# ===== YCLOUD WHATSAPP BUSINESS API =====
YCLOUD_API_BASE_URL=https://api.ycloud.com
YCLOUD_API_KEY=be2f369c4c53ca0d4fdafb5d3f4b744d
YCLOUD_WHATSAPP_BUSINESS_ID=TU_BUSINESS_ID_AQUI
```

**Reemplaza `TU_BUSINESS_ID_AQUI`** con el ID que encontraste en el paso anterior.

### Ejemplo completo (con tu Business ID real):

```env
# ===== YCLOUD WHATSAPP BUSINESS API =====
YCLOUD_API_BASE_URL=https://api.ycloud.com
YCLOUD_API_KEY=be2f369c4c53ca0d4fdafb5d3f4b744d
YCLOUD_WHATSAPP_BUSINESS_ID=829679566471327
```

---

## 🚀 Paso 3: Configurar en Vercel (Producción)

Si ya desplegaste en Vercel, también debes agregar estas variables en el panel de Vercel:

1. **Ve a:** https://vercel.com/digiautomatiza/settings/environment-variables
2. **Agrega las 3 variables:**
   - `YCLOUD_API_BASE_URL` = `https://api.ycloud.com`
   - `YCLOUD_API_KEY` = `be2f369c4c53ca0d4fdafb5d3f4b744d`
   - `YCLOUD_WHATSAPP_BUSINESS_ID` = `829679566471327`
3. **Selecciona:** Production, Preview, Development
4. **Guarda** y **redespliega** la aplicación

---

## ✅ Paso 4: Probar el Envío

Una vez configurado:

1. **Reinicia el servidor backend local** (si estás probando localmente):
   ```bash
   cd server
   npm run dev
   ```

2. **Ve a la aplicación** → Página de Clientes
3. **Selecciona clientes** y haz clic en **"Envío Masivo WhatsApp"**
4. **Escribe un mensaje** y envía

### ⚠️ Límites Iniciales

- **5 mensajes en 24 horas** (límite inicial de YCloud)
- **Solo a números que hayan iniciado conversación contigo** (dentro de la ventana de 24h)
- Para enviar a más números, necesitas **plantillas aprobadas** o **verificar tu negocio**

---

## 🔍 Si no encuentras el Business ID

Si no ves un campo "Business ID" o "Channel ID" en el panel de YCloud:

1. **Revisa la documentación de YCloud:** https://docs.ycloud.com
2. **Contacta al soporte de YCloud** y pregunta: "¿Cuál es el Business ID o Channel ID para mi número +1 555 836 6820?"
3. **Alternativa temporal:** Intenta usar el número sin el `+` como business_id:
   ```env
   YCLOUD_WHATSAPP_BUSINESS_ID=15558366820
   ```
   (Esto puede funcionar dependiendo de cómo YCloud maneje los IDs)

---

## 📚 Recursos

- **Documentación YCloud:** https://docs.ycloud.com
- **Panel de YCloud:** https://console.ycloud.com
- **WhatsApp Business Policy:** https://www.whatsapp.com/legal/business-policy

---

## 🆘 Solución de Problemas

### Error: "YCloud no está configurado"
- Verifica que las 3 variables estén en `.env`
- Reinicia el servidor backend

### Error: "Invalid business_id"
- Verifica que el `YCLOUD_WHATSAPP_BUSINESS_ID` sea correcto
- Asegúrate de que el número esté "Conectado" en YCloud

### Error: "Rate limit exceeded"
- Has alcanzado el límite de 5 mensajes en 24h
- Espera 24 horas o solicita verificación de negocio en YCloud

---

**¿Necesitas ayuda?** Revisa los logs del backend para ver mensajes de error específicos.

