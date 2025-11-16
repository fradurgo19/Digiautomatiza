# Guía de Integración con Backend

Este documento describe cómo integrar el frontend de Digiautomatiza con un backend real.

## 📋 Requisitos del Backend

El backend debe proporcionar los siguientes endpoints y funcionalidades:

### 1. Autenticación

#### POST /api/auth/login
```json
Request:
{
  "email": "comercial@digiautomatiza.com",
  "password": "password"
}

Response:
{
  "token": "jwt-token",
  "usuario": {
    "id": "1",
    "nombre": "Usuario Comercial",
    "email": "comercial@digiautomatiza.com",
    "rol": "comercial",
    "activo": true
  }
}
```

#### POST /api/auth/logout
```json
Request:
{
  "token": "jwt-token"
}

Response:
{
  "success": true
}
```

### 2. Formulario de Contacto

#### POST /api/contacto
```json
Request:
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "telefono": "+57 300 123 4567",
  "empresa": "Empresa XYZ",
  "servicio": "paginas-web",
  "mensaje": "Estoy interesado en sus servicios"
}

Response:
{
  "success": true,
  "message": "Contacto recibido correctamente",
  "id": "contact-123"
}
```

**Funcionalidad adicional:**
- Enviar email a `digiautomatiza@outlook.com` con los datos del formulario
- Guardar en base de datos para seguimiento

### 3. Gestión de Clientes

#### GET /api/clientes
```json
Response:
{
  "clientes": [
    {
      "id": "1",
      "nombre": "Cliente Ejemplo",
      "email": "cliente@ejemplo.com",
      "telefono": "+57 300 123 4567",
      "empresa": "Empresa ABC",
      "serviciosInteres": ["paginas-web", "chatbot-ia"],
      "estado": "interesado",
      "fechaRegistro": "2025-10-19T00:00:00Z",
      "notas": "Cliente muy interesado"
    }
  ]
}
```

#### POST /api/clientes
```json
Request:
{
  "nombre": "Nuevo Cliente",
  "email": "nuevo@ejemplo.com",
  "telefono": "+57 300 123 4567",
  "empresa": "Nueva Empresa",
  "serviciosInteres": ["aplicaciones-web"],
  "estado": "nuevo",
  "notas": "Primer contacto"
}

Response:
{
  "success": true,
  "cliente": { /* objeto cliente completo */ }
}
```

#### PUT /api/clientes/:id
#### DELETE /api/clientes/:id

### 4. Envío Masivo de Correos

#### POST /api/correo-masivo
```json
Request (multipart/form-data):
{
  "destinatarios": ["email1@ejemplo.com", "email2@ejemplo.com"],
  "asunto": "Oferta especial",
  "mensaje": "Contenido del correo...",
  "archivos": [File, File, ...]
}

Response:
{
  "success": true,
  "enviados": 2,
  "errores": 0,
  "detalles": []
}
```

**Servicios recomendados:**
- **SendGrid**: Fácil integración, plantillas HTML, analytics
- **AWS SES**: Económico, escalable, requiere verificación de dominio
- **Resend**: Moderno, excelente DX, soporte de React Email
- **Mailgun**: Robusto, buena deliverability

**Ejemplo con SendGrid (Node.js):**
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/api/correo-masivo', async (req, res) => {
  const { destinatarios, asunto, mensaje, archivos } = req.body;
  
  const emails = destinatarios.map(to => ({
    to,
    from: 'digiautomatiza@outlook.com',
    subject: asunto,
    html: mensaje,
    attachments: archivos // configurar según formato SendGrid
  }));
  
  await sgMail.send(emails);
  res.json({ success: true, enviados: emails.length });
});
```

### 5. Envío Masivo de WhatsApp

#### POST /api/whatsapp-masivo
```json
Request (multipart/form-data):
{
  "numeros": ["+573001234567", "+573007654321"],
  "mensaje": "Texto del mensaje",
  "archivos": [File, File, ...]
}

Response:
{
  "success": true,
  "enviados": 2,
  "errores": 0,
  "detalles": []
}
```

**Servicios recomendados:**
- **Twilio WhatsApp API**: Más fácil de implementar, requiere aprobación
- **Meta Cloud API**: Oficial de WhatsApp, gratuito con límites
- **360dialog**: Proveedor verificado, buen soporte
- **WATI**: Especializado en WhatsApp Business

**Ejemplo con Twilio (Node.js):**
```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.post('/api/whatsapp-masivo', async (req, res) => {
  const { numeros, mensaje, archivos } = req.body;
  
  const promises = numeros.map(numero => 
    client.messages.create({
      body: mensaje,
      from: 'whatsapp:+14155238886', // Número de Twilio
      to: `whatsapp:${numero}`,
      mediaUrl: archivos.map(a => a.url) // URLs de archivos
    })
  );
  
  await Promise.all(promises);
  res.json({ success: true, enviados: numeros.length });
});
```

### 6. Gestión de Sesiones

#### GET /api/sesiones
#### POST /api/sesiones
#### PUT /api/sesiones/:id
#### DELETE /api/sesiones/:id

Similar estructura a los endpoints de clientes.

## 🔧 Variables de Entorno Necesarias

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/digiautomatiza

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=digiautomatiza@outlook.com

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886

# Configuración del servidor
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tu-dominio.com
```

## 🗄️ Esquema de Base de Datos Sugerido

```sql
-- Tabla de usuarios (personal comercial)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'comercial',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50) NOT NULL,
  empresa VARCHAR(255),
  servicios_interes TEXT[], -- Array de servicios
  estado VARCHAR(50) NOT NULL DEFAULT 'nuevo',
  notas TEXT,
  fecha_registro TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de sesiones programadas
CREATE TABLE sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  servicio VARCHAR(50) NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'programada',
  notas TEXT,
  url_reunion VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de contactos (formulario público)
CREATE TABLE contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(50) NOT NULL,
  empresa VARCHAR(255),
  servicio VARCHAR(50) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_envio TIMESTAMP DEFAULT NOW(),
  atendido BOOLEAN DEFAULT false
);

-- Tabla de envíos masivos (historial)
CREATE TABLE envios_masivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL, -- 'email' o 'whatsapp'
  usuario_id UUID REFERENCES usuarios(id),
  destinatarios TEXT[] NOT NULL,
  asunto VARCHAR(500), -- Solo para emails
  mensaje TEXT NOT NULL,
  enviados INTEGER DEFAULT 0,
  errores INTEGER DEFAULT 0,
  fecha_envio TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_estado ON clientes(estado);
CREATE INDEX idx_sesiones_cliente ON sesiones(cliente_id);
CREATE INDEX idx_sesiones_fecha ON sesiones(fecha);
CREATE INDEX idx_contactos_fecha ON contactos(fecha_envio);
```

## 🚀 Stack Backend Recomendado

### Opción 1: Node.js + Express + PostgreSQL
```bash
npm install express pg bcrypt jsonwebtoken @sendgrid/mail twilio
```

### Opción 2: Node.js + NestJS + PostgreSQL
```bash
npm install @nestjs/core @nestjs/common @nestjs/typeorm pg
```

### Opción 3: Supabase (Backend as a Service)
- Ya incluido en el proyecto
- Autenticación incorporada
- Base de datos PostgreSQL
- Storage para archivos
- Edge Functions para lógica personalizada

## 📦 Integración con Supabase (Recomendado para MVP)

1. Crear proyecto en https://supabase.com
2. Configurar las tablas usando el esquema SQL anterior
3. Configurar variables de entorno:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

4. Actualizar `src/context/AuthContext.tsx` para usar Supabase
5. Crear servicios para CRUD de clientes y sesiones

## 🔐 Seguridad

- Usar HTTPS en producción
- Implementar rate limiting para APIs
- Validar y sanitizar todas las entradas
- Usar JWT con expiración
- Hash de contraseñas con bcrypt
- CORS configurado correctamente
- Protección contra inyección SQL
- Validación de archivos adjuntos (tipo, tamaño)

## 📧 Configuración de Email para Outlook

Para enviar desde `digiautomatiza@outlook.com`:

1. **Opción A - SMTP directo:**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: 'digiautomatiza@outlook.com',
    pass: 'tu-contraseña'
  }
});
```

2. **Opción B - Microsoft Graph API:**
Más seguro y recomendado para aplicaciones empresariales.

## 🧪 Testing

- Probar envío de correos con cuentas de prueba
- Validar números de WhatsApp antes de enviar
- Implementar logs de todas las operaciones
- Monitorear tasas de entrega

## 📞 Soporte

Para dudas sobre la integración:
- Email: digiautomatiza@outlook.com
- Ver documentación del frontend en README.md

