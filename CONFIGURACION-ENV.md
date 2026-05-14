# 🔧 Configuración de Variables de Entorno

## Crear archivo .env

Crea un archivo llamado `.env` en la raíz del proyecto con este contenido:

```env
# ===== WHATSAPP =====

# Opción 1: Twilio WhatsApp API
# Obtén tus credenciales en: https://console.twilio.com
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=tu_auth_token_aqui
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Opción 2: Meta Cloud API (WhatsApp Business)
# Obtén tus credenciales en: https://developers.facebook.com/apps
VITE_META_ACCESS_TOKEN=tu_access_token_aqui
VITE_META_PHONE_NUMBER_ID=tu_phone_number_id_aqui

# ===== BACKEND =====
VITE_BACKEND_URL=http://localhost:3000

# ===== EMAIL / SMTP OUTLOOK =====
EMAIL_PROVIDER=outlook
EMAIL_USER=digiautomatiza@outlook.com
EMAIL_PASSWORD=tu_app_password_o_contraseña
EMAIL_FROM=digiautomatiza@outlook.com

# ===== SUPABASE (Opcional) =====
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# ===== EMAIL (Para futuras implementaciones) =====
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx

# ===== PASARELA DE PAGOS (Vercel / API) =====
# Pasarela activa. Producción → mercado-pago. Legacy → payu.
PAYMENT_PROVIDER=mercado-pago

# URL pública del sitio (CRÍTICO en producción). Se usa para:
#   - notification_url de Mercado Pago
#   - back_urls (success/failure/pending) de Checkout Pro
# Debe ser HTTPS y SIN slash final.
PUBLIC_BASE_URL=https://www.digiautomatiza.co

# ----- Mercado Pago -----
# Access Token de tu aplicación (producción o pruebas) desde
# https://www.mercadopago.com.co/developers/panel/app
#   - Producción → empieza por APP_USR-
#   - Pruebas    → empieza por TEST-
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxx

# Clave secreta del Webhook para validar la firma x-signature de las notificaciones.
# Se obtiene en: MP Panel → Tu aplicación → Webhooks → "Clave secreta".
# OBLIGATORIO en producción (sin él se omite la validación de firma y se aceptan webhooks no firmados).
MERCADOPAGO_WEBHOOK_SECRET=tu_clave_secreta_de_webhook

# En MP Panel → Tu aplicación → Webhooks:
#   URL de notificación de PRODUCCIÓN: https://www.digiautomatiza.co/api/pagos
#   Eventos a suscribir: "Pagos" (payment)
#   Modo: Productivo

# ----- PayU (legacy, solo si PAYMENT_PROVIDER=payu) -----
# PAYU_MERCHANT_ID=...
# PAYU_API_KEY=...
# PAYU_API_LOGIN=...
# PAYU_ACCOUNT_ID=...
# PAYU_TEST_MODE=true

# ===== PRISMA / BASE DE DATOS =====
# Para desarrollo local con PostgreSQL 17 (docker-compose.postgres.yml)
DATABASE_URL="postgresql://digiauto:digiauto@localhost:5432/digiautomatiza_local?schema=public"
DIRECT_URL="postgresql://digiauto:digiauto@localhost:5432/digiautomatiza_local?schema=public"

# Para producción (Neon / Supabase), cambia las credenciales anteriores
# DATABASE_URL="postgresql://usuario:password@host:port/db?sslmode=require&schema=public"
# DIRECT_URL="postgresql://usuario:password@host:port/db?sslmode=require&schema=public"
```

## ⚠️ Importante

1. El archivo `.env` NO debe subirse a Git (ya está en .gitignore)
2. Todas las variables deben comenzar con `VITE_` para que Vite las reconozca
3. Después de modificar `.env`, reinicia el servidor: `npm run dev`
4. Prisma y el backend leen también las variables SIN prefijo `VITE_` (por ejemplo `DATABASE_URL`, `EMAIL_PROVIDER`, etc.)

## 🔐 Seguridad

- Nunca compartas tus credenciales
- No las subas a repositorios públicos
- Usa diferentes credenciales para desarrollo y producción

