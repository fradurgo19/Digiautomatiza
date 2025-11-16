# 📧 Guía: Configurar Envío de Correos

Tienes **3 opciones** para configurar el envío de correos. Elige la que prefieras:

---

## 🎯 OPCIÓN 1: Resend (RECOMENDADO - Más Fácil)

### Ventajas:
- ✅ Configuración en 2 minutos
- ✅ 3,000 emails gratis al mes
- ✅ Muy fácil de usar
- ✅ Excelente para desarrollo y producción
- ✅ Sin necesidad de 2FA ni contraseñas complicadas

### Pasos:

#### 1. Crear cuenta (2 minutos)
1. Ve a: https://resend.com
2. Clic en **"Get Started"**
3. Regístrate con GitHub o Email

#### 2. Obtener API Key (1 minuto)
1. Una vez dentro, ve a **"API Keys"**
2. Clic en **"Create API Key"**
3. Nombre: `Digiautomatiza`
4. **Copia la API Key** (empieza con `re_...`)

#### 3. Configurar Dominio (Opcional pero recomendado)
1. Ve a **"Domains"**
2. Agrega tu dominio o usa el dominio de prueba
3. Para pruebas puedes usar: `onboarding@resend.dev`

#### 4. Actualizar .env
```env
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_tu_api_key_aqui
VITE_EMAIL_FROM=digiautomatiza@resend.dev
```

#### 5. Probar
```bash
npm run email:dev
```

✅ ¡Listo! Es así de simple.

---

## 🔐 OPCIÓN 2: Outlook con App Password

### Ventajas:
- ✅ Usas tu cuenta actual de Outlook
- ✅ Gratis

### Desventajas:
- ❌ Requiere habilitar verificación en 2 pasos
- ❌ Proceso más largo

### Pasos:

#### 1. Habilitar Verificación en Dos Pasos
1. Ve a: https://account.microsoft.com/security
2. Inicia sesión con `digiautomatiza@outlook.com`
3. Busca **"Verificación en dos pasos"**
4. Clic en **"Activar"**
5. Sigue el asistente (necesitarás tu teléfono o email de recuperación)

#### 2. Generar App Password
1. Una vez habilitada 2FA, regresa a: https://account.microsoft.com/security
2. Busca **"Contraseñas de aplicación"** o **"App passwords"**
3. Clic en **"Crear nueva contraseña"**
4. Nombre: `Digiautomatiza Email`
5. **Copia la contraseña** (formato: `abcd-efgh-ijkl-mnop`)

#### 3. Actualizar .env
```env
VITE_EMAIL_PROVIDER=outlook
VITE_EMAIL_PASSWORD=abcd-efgh-ijkl-mnop
```
(Reemplaza `Panela7760*` con la App Password)

#### 4. Probar
```bash
npm run email:dev
```

**Nota:** Si no ves la opción de App Passwords, es porque:
- No has habilitado 2FA correctamente
- Tu cuenta es personal (necesitas Microsoft 365)
- Outlook.com ha removido esta función

En ese caso, usa **Resend** (Opción 1).

---

## 💼 OPCIÓN 3: SendGrid

### Ventajas:
- ✅ Muy profesional
- ✅ 100 emails gratis al día
- ✅ Excelentes herramientas de analytics

### Desventajas:
- ❌ Requiere verificación de identidad
- ❌ Proceso más largo

### Pasos:

#### 1. Crear cuenta
1. Ve a: https://signup.sendgrid.com
2. Regístrate (necesitarás verificar tu identidad)

#### 2. Crear API Key
1. Ve a **Settings** → **API Keys**
2. **Create API Key**
3. Nombre: `Digiautomatiza`
4. **Full Access**
5. **Copia la API Key** (empieza con `SG.`)

#### 3. Verificar Sender
1. Ve a **Settings** → **Sender Authentication**
2. Verifica tu email `digiautomatiza@outlook.com`
3. Revisa tu email y confirma

#### 4. Actualizar .env
```env
VITE_EMAIL_PROVIDER=sendgrid
VITE_SENDGRID_API_KEY=SG.tu_api_key_aqui
VITE_EMAIL_FROM=digiautomatiza@outlook.com
```

#### 5. Probar
```bash
npm run email:dev
```

---

## 🚀 MI RECOMENDACIÓN

**Usa RESEND (Opción 1)**

Porque:
- ⏰ 2 minutos de configuración
- 🎯 Funciona inmediatamente
- 💰 3,000 emails gratis
- 🛠️ Perfecto para producción
- 📊 Tracking y analytics incluidos

---

## 📝 Instrucciones Rápidas para Resend:

### 1. Regístrate aquí:
https://resend.com/signup

### 2. Obtén tu API Key
En el dashboard, ve a **API Keys** → **Create API Key**

### 3. Dime tu API Key y yo actualizo todo
O copia este formato en tu `.env`:

```env
# ===== EMAIL - RESEND =====
VITE_EMAIL_PROVIDER=resend
VITE_RESEND_API_KEY=re_TuApiKeyAqui_xxxxxxxxxxx
VITE_EMAIL_FROM=onboarding@resend.dev
```

### 4. Actualiza el servidor
Voy a actualizar `server/emailServer.js` para soportar Resend.

---

## 🆘 ¿Cuál elijo?

| Situación | Recomendación |
|-----------|---------------|
| Quiero algo rápido y fácil | ✅ **Resend** |
| Ya uso Outlook y puedo configurar 2FA | Outlook |
| Proyecto grande con muchos emails | SendGrid |
| Desarrollo y pruebas | ✅ **Resend** |
| Producción | ✅ **Resend** o SendGrid |

---

¿Cuál opción prefieres? Te ayudo a configurarla ahora mismo. 😊

