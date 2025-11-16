# 🚀 Guía Completa: Despliegue en Vercel

Instrucciones paso a paso para desplegar Digiautomatiza en Vercel con Neon.

---

## 📋 Requisitos Previos

Antes de desplegar, asegúrate de tener:

- ✅ Proyecto funcionando localmente
- ✅ Base de datos Neon configurada y funcionando
- ✅ Cuenta de GitHub (para subir el código)
- ✅ Todas las variables de entorno configuradas

---

## 🔧 Paso 1: Subir el Código a GitHub (5 minutos)

### 1.1 Crear Repositorio en GitHub

1. **Ve a:** https://github.com/new
2. **Nombre del repositorio:** `digiautomatiza`
3. **Visibilidad:** Private (recomendado) o Public
4. **NO marcar** "Initialize with README" (ya tienes uno)
5. **Clic en "Create repository"**

### 1.2 Subir tu Código

**En tu terminal del proyecto**, ejecuta:

```bash
# Inicializar Git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit: Digiautomatiza sistema completo"

# Conectar con GitHub (reemplaza TU-USUARIO)
git remote add origin https://github.com/TU-USUARIO/digiautomatiza.git

# Subir el código
git branch -M main
git push -u origin main
```

✅ Tu código ahora está en GitHub

---

## 🌐 Paso 2: Crear Cuenta en Vercel (3 minutos)

1. **Ve a:** https://vercel.com/signup
2. **Regístrate con GitHub** (más fácil)
3. **Autoriza Vercel** a acceder a tus repositorios
4. **Completa tu perfil**

---

## 📦 Paso 3: Importar Proyecto a Vercel (2 minutos)

1. **En el Dashboard de Vercel**, clic en **"Add New..."** → **"Project"**

2. **Importar repositorio:**
   - Busca: `digiautomatiza`
   - Clic en **"Import"**

3. **Configuración del proyecto:**
   - **Project Name:** `digiautomatiza` (o el que prefieras)
   - **Framework Preset:** Vite (debería detectarlo automáticamente)
   - **Root Directory:** `./` (dejar por defecto)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. **NO hagas clic en Deploy todavía** ⚠️

---

## 🔐 Paso 4: Configurar Variables de Entorno en Vercel (5 minutos)

**MUY IMPORTANTE:** Antes de desplegar, configura las variables de entorno.

### 4.1 En la página de configuración del proyecto

Baja hasta **"Environment Variables"**

### 4.2 Agrega estas variables (usa tus credenciales reales):

**Variables de Base de Datos:**
```
DATABASE_URL = postgresql://USUARIO:CONTRASEÑA@HOST/neondb?sslmode=require

DIRECT_URL = postgresql://USUARIO:CONTRASEÑA@HOST/neondb?sslmode=require&connect_timeout=10
```

**Variables de Email (Resend):**
```
EMAIL_PROVIDER = resend

RESEND_API_KEY = tu_resend_api_key

EMAIL_FROM = onboarding@resend.dev

EMAIL_USER = digiautomatiza@outlook.com
```

**Variables de WhatsApp (Twilio):**
```
VITE_TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx

VITE_TWILIO_AUTH_TOKEN = tu_twilio_auth_token

VITE_TWILIO_WHATSAPP_NUMBER = whatsapp:+14155238886
```

**Variables del Backend:**
```
VITE_BACKEND_URL = https://digiautomatiza.vercel.app
```
(Reemplaza con tu URL de Vercel después del deploy)

### 4.3 Para TODAS las variables:

- **Environment:** Selecciona **Production, Preview, Development**
- Esto asegura que funcionen en todos los ambientes

---

## 🚀 Paso 5: Desplegar (2 minutos)

1. **Después de configurar todas las variables**, clic en **"Deploy"**

2. **Espera 2-3 minutos** mientras Vercel:
   - ✅ Instala dependencias
   - ✅ Genera cliente de Prisma
   - ✅ Compila el proyecto
   - ✅ Despliega a su CDN global

3. **Verás la pantalla de celebración** 🎉

4. **Copia tu URL de producción:**
   ```
   https://digiautomatiza.vercel.app
   ```
   (o el nombre que le hayas puesto)

---

## 🔧 Paso 6: Actualizar Variables de Entorno (1 minuto)

**Importante:** Ahora que tienes tu URL de Vercel, actualízala:

1. **Ve a:** Settings → Environment Variables
2. **Busca:** `VITE_BACKEND_URL`
3. **Edítala** y pon tu URL real:
   ```
   https://digiautomatiza.vercel.app
   ```
4. **Save**

5. **Redeploy:**
   - Ve a Deployments
   - En el último deployment, clic en los 3 puntos (...)
   - **"Redeploy"**

---

## ✅ Paso 7: Verificar que Funciona

1. **Abre tu URL de Vercel** en el navegador

2. **Deberías ver** la página principal de Digiautomatiza

3. **Prueba el inicio de sesión:**
   - Email: `comercial@digiautomatiza.com`
   - Contraseña: `comercial2025`

4. **Agrega un cliente de prueba**

5. **Verifica en Prisma Studio** (local) o en Neon Dashboard que el cliente se guardó

---

## 🎯 URLs de tu Aplicación

Después del despliegue tendrás:

- **Producción:** https://digiautomatiza.vercel.app
- **API Health:** https://digiautomatiza.vercel.app/api/health
- **API Clientes:** https://digiautomatiza.vercel.app/api/clientes
- **API Sesiones:** https://digiautomatiza.vercel.app/api/sesiones
- **API Contacto:** https://digiautomatiza.vercel.app/api/contacto

---

## 🔄 Auto-Deploy Configurado

Vercel está configurado para **despliegue automático**:

Cada vez que hagas:
```bash
git add .
git commit -m "Actualización"
git push
```

Vercel automáticamente:
- ✅ Detecta el cambio
- ✅ Compila el proyecto
- ✅ Despliega la nueva versión
- ✅ Te notifica por email

---

## 🚨 Solución de Problemas

### Error: "Build failed"

**Causa:** Variables de entorno no configuradas  
**Solución:** Verifica que todas las variables estén en Settings → Environment Variables

### Error: "Prisma Client not generated"

**Causa:** Build command incorrecto  
**Solución:** En Settings → General → Build Command debe ser:
```
npm run build && npm run db:generate
```

### La aplicación carga pero no guarda datos

**Causa:** DATABASE_URL incorrecta  
**Solución:** Verifica que la URL de Neon esté correcta en las variables de entorno

### CORS Error

**Causa:** Backend no configurado  
**Solución:** Ya está configurado en los archivos `/api/*.js`

---

## 📊 Monitoreo en Vercel

### Analytics
- Ve a tu proyecto → Analytics
- Verás visitas, rendimiento, errores

### Logs
- Ve a Deployments → Tu deployment → Functions
- Puedes ver logs de cada función serverless

### Database Connection
- Ve a Settings → Environment Variables
- Verifica que DATABASE_URL esté correcta

---

## 💰 Costos

**Vercel Free Tier incluye:**
- ✅ 100 GB de bandwidth
- ✅ Despliegues ilimitados
- ✅ Dominios personalizados
- ✅ SSL automático
- ✅ Perfecto para este proyecto

**Neon Free Tier incluye:**
- ✅ 10 GB de storage
- ✅ 100 horas compute/mes
- ✅ Suficiente para producción

**Resend Free Tier:**
- ✅ 3,000 emails/mes
- ✅ 100 emails/día

**Twilio (WhatsApp):**
- 💰 $0.005 por mensaje
- Usa tu crédito de $15 gratis

---

## 🎯 Dominios Personalizados (Opcional)

Si tienes un dominio (ej: `digiautomatiza.com`):

1. **Ve a:** Settings → Domains
2. **Add Domain**
3. **Sigue las instrucciones** para configurar DNS
4. **Vercel configurará SSL** automáticamente

---

## ✅ Checklist de Despliegue

- [ ] Código subido a GitHub
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas:
  - [ ] DATABASE_URL
  - [ ] DIRECT_URL
  - [ ] RESEND_API_KEY
  - [ ] EMAIL_PROVIDER=resend
  - [ ] VITE_TWILIO_* (3 variables)
  - [ ] VITE_BACKEND_URL
- [ ] Deploy ejecutado
- [ ] URL de producción obtenida
- [ ] VITE_BACKEND_URL actualizada con URL real
- [ ] Redeploy ejecutado
- [ ] Aplicación probada en producción
- [ ] Cliente de prueba agregado
- [ ] Datos verificados en Neon

---

## 🎊 ¡Listo para Producción!

Una vez completados todos los pasos:

✅ Tu aplicación estará en línea 24/7  
✅ Accesible desde cualquier parte del mundo  
✅ Con certificado SSL (https)  
✅ Auto-deploy con cada commit  
✅ Base de datos en la nube  
✅ Emails y WhatsApp funcionando  

---

¿Necesitas ayuda con algún paso específico? 😊🚀

