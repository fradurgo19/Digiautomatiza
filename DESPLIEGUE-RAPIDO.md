# ⚡ Despliegue Rápido en Vercel - 10 Minutos

## 🎯 Resumen de Pasos

### 1. Subir a GitHub (3 min)

```bash
git init
git add .
git commit -m "Initial commit: Digiautomatiza"
git remote add origin https://github.com/TU-USUARIO/digiautomatiza.git
git branch -M main
git push -u origin main
```

### 2. Importar en Vercel (2 min)

1. https://vercel.com/new
2. Importar repositorio `digiautomatiza`
3. Framework: Vite
4. NO DESPLEGAR TODAVÍA

### 3. Variables de Entorno (5 min)

Copia y pega en Vercel → Environment Variables (usa tus credenciales reales):

```
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@HOST/neondb?sslmode=require

DIRECT_URL=postgresql://USUARIO:CONTRASEÑA@HOST/neondb?sslmode=require&connect_timeout=10

EMAIL_PROVIDER=resend

RESEND_API_KEY=tu_resend_api_key

EMAIL_FROM=onboarding@resend.dev

EMAIL_USER=digiautomatiza@outlook.com

VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx

VITE_TWILIO_AUTH_TOKEN=tu_twilio_auth_token

VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

VITE_BACKEND_URL=https://digiautomatiza.vercel.app
```

**Importante:** Para cada variable, selecciona: Production, Preview, Development

### 4. Deploy (2 min)

Clic en **"Deploy"** y espera.

### 5. Verificar

Abre tu URL y prueba:
- ✅ Página principal carga
- ✅ Inicio de sesión funciona
- ✅ Agregar cliente guarda en Neon

---

## ✅ ¡Listo!

Tu aplicación está en línea y funcionando con:
- ✅ Vercel (Frontend + API)
- ✅ Neon (Base de datos)
- ✅ Resend (Emails)
- ✅ Twilio (WhatsApp)

---

Ver guía completa: **GUIA-DESPLIEGUE-VERCEL.md**

