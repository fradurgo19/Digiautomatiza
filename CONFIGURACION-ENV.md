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

# ===== SUPABASE (Opcional) =====
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# ===== EMAIL (Para futuras implementaciones) =====
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx

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

