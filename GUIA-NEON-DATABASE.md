# 🗄️ Guía Completa: Base de Datos con Neon PostgreSQL

Documentación paso a paso para configurar tu base de datos en Neon y desplegar en Vercel.

---

## 🧪 Desarrollo Local (PostgreSQL 17)

Antes de ir a Neon, puedes trabajar totalmente en local con PostgreSQL 17 para pruebas rápidas:

1. **Levanta la base de datos local**
   ```bash
   docker compose -f docker-compose.postgres.yml up -d
   ```
   Esto crea un contenedor `digiautomatiza-postgres` con usuario `digiauto` y base `digiautomatiza_local` en el puerto `5432`.

2. **Configura tu `.env`**
   ```env
   DATABASE_URL="postgresql://digiauto:digiauto@localhost:5432/digiautomatiza_local?schema=public"
   DIRECT_URL="postgresql://digiauto:digiauto@localhost:5432/digiautomatiza_local?schema=public"
   ```

3. **Aplica el schema y abre Prisma Studio**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:studio
   ```

4. **Inicia el backend**
   ```bash
   npm run api:dev
   ```

Ahora todas las operaciones de `Clientes`, `Sesiones` y `Contactos` se guardan en tu PostgreSQL local. Cuando quieras pasar a producción, sigue los pasos de Neon que se describen a continuación.

---

## 🎯 ¿Qué es Neon?

**Neon** es una plataforma de PostgreSQL serverless diseñada para:
- ✅ Auto-scaling automático
- ✅ Gratis hasta 10 GB de almacenamiento
- ✅ Perfecto para Vercel y despliegues modernos
- ✅ Rápido y confiable
- ✅ Sin necesidad de gestionar servidores

---

## 📋 Paso 1: Crear Cuenta en Neon (2 minutos)

1. **Ve a:** https://neon.tech
2. **Haz clic en "Sign Up"**
3. **Regístrate con:**
   - GitHub (recomendado)
   - Google
   - Email

✅ La cuenta gratuita incluye:
- 10 GB de almacenamiento
- 1 proyecto
- Ramas ilimitadas
- Perfecto para este proyecto

---

## 📋 Paso 2: Crear Proyecto (3 minutos)

1. **Después de iniciar sesión, clic en "Create Project"**

2. **Configuración:**
   - **Project name:** `digiautomatiza-prod`
   - **Region:** Selecciona el más cercano (ej: `US East (Ohio)` o `Europe (Frankfurt)`)
   - **Postgres version:** Deja la última versión
   - **Database name:** `digiautomatiza`

3. **Haz clic en "Create Project"**

⏳ Espera 30 segundos mientras se crea...

---

## 📋 Paso 3: Obtener Connection Strings (2 minutos)

Una vez creado el proyecto, verás **Connection Details**:

1. **Copia el "Connection string" que dice "Pooled connection":**
   ```
   postgresql://username:password@host.neon.tech/database?sslmode=require
   ```

2. **Copia también el "Direct connection":**
   ```
   postgresql://username:password@host.neon.tech/database?sslmode=require&connect_timeout=10
   ```

📝 **Guárdalos en un archivo temporal**

---

## 📋 Paso 4: Configurar Variables de Entorno Locales

1. **Abre tu archivo `.env`** en la raíz del proyecto

2. **Reemplaza las líneas de DATABASE:**

```env
# ===== DATABASE - NEON =====
DATABASE_URL=postgresql://username:password@host.neon.tech/database?sslmode=require
DIRECT_URL=postgresql://username:password@host.neon.tech/database?sslmode=require&connect_timeout=10
```

**Ejemplo real:**
```env
DATABASE_URL=postgresql://neondb_owner:AbCd1234XyZ@ep-cool-rain-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:AbCd1234XyZ@ep-cool-rain-12345.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=10
```

3. **Guarda el archivo** (Ctrl + S)

---

## 📋 Paso 5: Aplicar el Esquema a la Base de Datos (2 minutos)

Ahora vamos a crear las tablas en Neon:

```bash
# Generar el cliente de Prisma
npm run db:generate

# Aplicar el esquema a Neon (crea todas las tablas)
npm run db:push
```

Verás algo como:
```
✔ Applying migration... done in 1.2s
✔ Generated Prisma Client
```

✅ **¡Las tablas ya están creadas en Neon!**

---

## 📋 Paso 6: Verificar en Neon Dashboard (1 minuto)

1. **Ve a tu proyecto en** https://console.neon.tech
2. **Clic en "Tables"** en el menú lateral
3. **Deberías ver:**
   - ✅ `clientes`
   - ✅ `sesiones`
   - ✅ `contactos`
   - ✅ `usuarios`
   - ✅ `envios_masivos`

---

## 📋 Paso 7: Iniciar Backend API (1 minuto)

Para que tu aplicación funcione con la base de datos:

```bash
# En una terminal, inicia el backend
npm run api:dev
```

Verás:
```
🚀 ========================================
   API Digiautomatiza
   Puerto: 3000
   Base de Datos: Neon PostgreSQL
========================================
```

---

## 📋 Paso 8: Probar la Aplicación

1. **Abre tu navegador:** http://localhost:5174/

2. **Inicia sesión:**
   - Email: `comercial@digiautomatiza.com`
   - Contraseña: `comercial2025`

3. **Agrega un cliente:**
   - Los datos ahora se guardan en Neon
   - ¡Son permanentes!

4. **Verifica en Prisma Studio:**
   ```bash
   npm run db:studio
   ```
   Se abrirá una interfaz web donde puedes ver todos tus datos.

---

## 🚀 Despliegue en Vercel (Producción)

### Paso 1: Preparar para Vercel

1. **Asegúrate que tu código esté en GitHub**

2. **Ve a:** https://vercel.com

3. **Conecta tu repositorio de GitHub**

### Paso 2: Configurar Variables de Entorno en Vercel

En el dashboard de Vercel:

1. **Settings** → **Environment Variables**

2. **Agrega estas variables:**

```
DATABASE_URL = postgresql://username:password@host.neon.tech/database?sslmode=require

DIRECT_URL = postgresql://username:password@host.neon.tech/database?sslmode=require&connect_timeout=10

VITE_TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN = xxxxxxxxxxxx
VITE_TWILIO_WHATSAPP_NUMBER = whatsapp:+14155238886

VITE_BACKEND_URL = https://tu-api.vercel.app
```

### Paso 3: Deploy

1. **Clic en "Deploy"**
2. **Espera 2-3 minutos**
3. **¡Listo!** Tu aplicación está en línea

---

## 🛠️ Scripts Útiles

```bash
# Ver base de datos en interfaz gráfica
npm run db:studio

# Generar cliente de Prisma después de cambios en schema
npm run db:generate

# Aplicar cambios de schema a la base de datos
npm run db:push

# Crear una migración (producción)
npm run db:migrate

# Iniciar backend API
npm run api:dev

# Iniciar servidor de email
npm run email:dev
```

---

## 📊 Estructura de las Tablas

### Tabla: `clientes`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String | ID único (cuid) |
| nombre | String | Nombre completo |
| email | String | Email del cliente |
| telefono | String | Teléfono con código país |
| empresa | String? | Nombre de empresa (opcional) |
| serviciosInteres | String[] | Array de servicios |
| estado | String | nuevo, contactado, interesado, etc. |
| notas | Text? | Notas adicionales |
| fechaRegistro | DateTime | Fecha de creación |

### Tabla: `sesiones`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String | ID único (cuid) |
| clienteId | String | ID del cliente (FK) |
| fecha | DateTime | Fecha de la sesión |
| hora | String | Hora de la sesión |
| servicio | String | Servicio a presentar |
| estado | String | programada, confirmada, etc. |
| notas | Text? | Notas de la sesión |
| urlReunion | String? | Link de Google Meet, Zoom, etc. |

### Tabla: `contactos`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String | ID único |
| nombre | String | Nombre del contacto |
| email | String | Email |
| telefono | String | Teléfono |
| empresa | String? | Empresa (opcional) |
| servicio | String | Servicio de interés |
| mensaje | Text | Mensaje del formulario |
| atendido | Boolean | Si ya fue atendido |
| fechaEnvio | DateTime | Cuándo se envió |

---

## 🔍 Consultas Útiles en Prisma Studio

### Ver todos los clientes interesados:
```sql
SELECT * FROM clientes WHERE estado = 'interesado';
```

### Ver sesiones del mes actual:
```sql
SELECT * FROM sesiones WHERE fecha >= CURRENT_DATE - INTERVAL '30 days';
```

### Ver contactos no atendidos:
```sql
SELECT * FROM contactos WHERE atendido = false ORDER BY fechaEnvio DESC;
```

---

## 🚨 Solución de Problemas

### Error: "Can't reach database server"

**Problema:** No se puede conectar con Neon  
**Solución:**
1. Verifica que las URLs estén correctas en `.env`
2. Asegúrate que incluyan `?sslmode=require`
3. Revisa que no haya espacios extras

### Error: "P1001: Can't reach database server"

**Problema:** Firewall o red bloqueando  
**Solución:**
1. Verifica tu conexión a internet
2. Intenta desde otra red
3. Revisa que Neon esté operativo: https://neon.tech/status

### Las tablas no aparecen en Neon

**Problema:** No se ejecutó `db:push`  
**Solución:**
```bash
npm run db:push
```

### Error al hacer queries

**Problema:** Cliente de Prisma no generado  
**Solución:**
```bash
npm run db:generate
```

---

## 💰 Límites del Plan Gratuito

**Neon Free Tier:**
- ✅ 10 GB de almacenamiento
- ✅ 100 horas de compute al mes
- ✅ 1 proyecto
- ✅ Branches ilimitados
- ✅ Perfecto para este proyecto

**¿Cuándo actualizar?**
- Si superas 10 GB de datos
- Si necesitas más de 100 horas de compute/mes
- Si necesitas múltiples proyectos

**Costo del plan Pro:** $19/mes

---

## 📈 Monitoreo

### Ver métricas en Neon Dashboard:

1. **Storage:** Cuánto espacio usas
2. **Compute time:** Horas activas
3. **Queries:** Número de consultas
4. **Connections:** Conexiones activas

### Alertas:

Neon te avisará por email cuando:
- Estés cerca del límite de storage
- Te quedes sin compute hours
- Haya problemas de conexión

---

## 🎯 Mejores Prácticas

### 1. Backups

Neon hace backups automáticos, pero también puedes:

```bash
# Exportar datos
npx prisma db pull > backup.sql
```

### 2. Desarrollo vs Producción

- **Desarrollo:** Usa una base de datos local o branch de Neon
- **Producción:** Usa el proyecto principal de Neon

### 3. Migraciones

```bash
# En desarrollo
npm run db:push

# En producción
npm run db:migrate
```

### 4. Índices

Ya están optimizados en el schema:
- ✅ Email de clientes (búsquedas rápidas)
- ✅ Estado de clientes (filtros)
- ✅ Fecha de sesiones (ordenamiento)

---

## 🔗 Recursos Adicionales

- **Documentación Neon:** https://neon.tech/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Comunidad Neon:** https://neon.tech/discord
- **Status Page:** https://neon.tech/status

---

## ✅ Checklist de Implementación

- [ ] Cuenta creada en Neon
- [ ] Proyecto creado
- [ ] Connection strings copiadas
- [ ] `.env` actualizado con DATABASE_URL y DIRECT_URL
- [ ] `npm run db:generate` ejecutado
- [ ] `npm run db:push` ejecutado
- [ ] Tablas verificadas en Neon Dashboard
- [ ] Backend API iniciado (`npm run api:dev`)
- [ ] Cliente de prueba agregado
- [ ] Datos verificados en Prisma Studio
- [ ] Todo funcionando correctamente

---

## 🎉 ¡Listo para Producción!

Ahora tu aplicación Digiautomatiza tiene:
- ✅ Base de datos real en Neon
- ✅ Persistencia de datos
- ✅ Listo para Vercel
- ✅ Escalable y profesional

¡Tu sistema está completo y listo para producción! 🚀

---

*Última actualización: Octubre 2025*

