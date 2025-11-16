# Digiautomatiza - Sistema de Gestión Comercial

Sistema web integral para la gestión comercial de Digiautomatiza, empresa especializada en digitalización y automatización de procesos empresariales.

## 🚀 Características Principales

### Página Pública
- **Página de Inicio**: Información completa sobre servicios ofrecidos
- **Formulario de Contacto**: Los clientes pueden solicitar información sobre servicios
- **Inicio de Sesión**: Acceso para personal comercial

### Panel Comercial (Autenticado)
- **Dashboard**: Vista general con estadísticas y acciones rápidas
- **Gestión de Clientes**: 
  - Base de datos de clientes con información completa
  - Estados de seguimiento (nuevo, contactado, interesado, etc.)
  - Búsqueda y filtrado de clientes
  - **📊 Importación/Exportación Masiva con Excel**:
    - Descargar plantilla Excel pre-configurada
    - Importar cientos de clientes desde Excel
    - Exportar base de datos completa a Excel
    - Validación automática de datos
    - Reporte detallado de éxitos y errores
- **Envío Masivo de Correos**: 
  - Selección múltiple de destinatarios
  - Adjuntar archivos (documentos, imágenes, videos, audios)
  - Personalización de mensaje
- **Envío Masivo de WhatsApp**: 
  - ✅ **Implementación completa con múltiples proveedores**
  - Envío a múltiples números con validación automática
  - Adjuntar multimedia (imágenes, videos, audios, documentos)
  - Soporte para Twilio WhatsApp API
  - Soporte para Meta Cloud API (WhatsApp Business)
  - Backend personalizado
  - Modo demo para desarrollo
  - Reporte detallado de éxitos y fallos
  - Formateo automático de números a estándar internacional
- **Programación de Sesiones**: 
  - Agendar reuniones con clientes interesados
  - Seguimiento de estado de sesiones
  - URLs de reunión virtuales
  - Notas y detalles por sesión

## 🛠️ Tecnologías Utilizadas

- **React 18+** con TypeScript
- **Vite** como herramienta de compilación
- **TailwindCSS** para estilos responsivos
- **React Router v6** para navegación
- **React Context API** para gestión de estado
- **XLSX** (SheetJS) para importación/exportación de Excel
- **Prisma ORM** para gestión de base de datos
- **Neon PostgreSQL** para base de datos serverless en producción
- **Express.js** para backend API
- **Nodemailer** para envío de correos

## 📁 Estructura del Proyecto (Atomic Design)

```
src/
├── atoms/          # Componentes básicos (Button, Input, Card, etc.)
├── molecules/      # Combinaciones de átomos (Forms, Cards, etc.)
├── organisms/      # Componentes complejos (Navbar, etc.)
├── templates/      # Plantillas de página
├── pages/          # Páginas completas
├── hooks/          # Hooks personalizados
├── services/       # Servicios de API y utilidades
├── types/          # Definiciones TypeScript
└── context/        # Contextos de React (Auth, etc.)
```

## 🚀 Instalación y Uso

### Requisitos Previos
- Node.js 18+ 
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

### Base de datos local (PostgreSQL 17)

```bash
# Levantar postgres 17 en docker
docker compose -f docker-compose.postgres.yml up -d

# Aplicar el schema de Prisma
npm run db:generate
npm run db:push

# Opcional: abrir Prisma Studio para verificar tablas
npm run db:studio

# Iniciar el backend (API Express + Prisma)
npm run api:dev
```

> Asegúrate de que tu `.env` tenga `DATABASE_URL` y `DIRECT_URL` apuntando a `postgresql://digiauto:digiauto@localhost:5432/digiautomatiza_local?schema=public`.

## 🔐 Credenciales de Acceso (Demo)

**Email**: comercial@digiautomatiza.com  
**Contraseña**: comercial2025

> ⚠️ En producción, estas credenciales deben ser reemplazadas por un sistema de autenticación seguro.

## 📧 Configuración de Servicios

### Envío de Correos
Para habilitar el envío real de correos, configura uno de estos servicios en `src/services/emailService.ts`:
- SendGrid
- AWS SES
- Resend
- Nodemailer con SMTP

### WhatsApp Business API
Para el envío de mensajes de WhatsApp, configura en `src/services/whatsappService.ts`:
- Twilio WhatsApp API
- Meta Cloud API
- 360dialog
- WhatsApp Business API oficial

## 🎨 Servicios de Digiautomatiza

1. **Páginas Web**: Diseño y desarrollo de sitios web modernos y responsivos
2. **Aplicaciones Web**: Desarrollo con Power Apps, React, Node.js, TypeScript y Java
3. **Chatbot con IA**: Construcción de chatbots inteligentes
4. **Automatización**: Procesos con N8N y Power Automate
5. **Análisis de Datos**: Visualización y análisis con Power BI

## 🔄 Despliegue en Vercel

Este proyecto está configurado para desplegarse automáticamente en Vercel. Los cambios en el repositorio se despliegan automáticamente.

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Desplegar
vercel
```

## 📝 Tareas Pendientes (Producción)

- [ ] Implementar backend real para autenticación
- [ ] Conectar con servicio de correo electrónico
- [ ] Integrar WhatsApp Business API
- [ ] Añadir base de datos persistente (Supabase/PostgreSQL)
- [ ] Implementar carga de archivos a cloud storage
- [ ] Añadir validaciones más robustas
- [ ] Implementar pruebas unitarias
- [ ] Añadir analíticas y seguimiento

## 👨‍💻 Desarrollo

```bash
# Verificar tipos TypeScript
npm run typecheck

# Linter
npm run lint
```

## 📚 Documentación Adicional

- **[GUIA-NEON-DATABASE.md](GUIA-NEON-DATABASE.md)** - 🗄️ Configuración completa de base de datos con Neon PostgreSQL
- **[GUIA-WHATSAPP.md](GUIA-WHATSAPP.md)** - 📱 Guía completa para configurar envío masivo de WhatsApp (Twilio, Meta Cloud API)
- **[GUIA-IMPORTACION-EXCEL.md](GUIA-IMPORTACION-EXCEL.md)** - 📊 Guía completa para importar/exportar clientes con Excel
- **[CONFIGURACION-ENV.md](CONFIGURACION-ENV.md)** - 🔧 Configuración de variables de entorno
- **[BACKEND-INTEGRATION.md](BACKEND-INTEGRATION.md)** - 🛠️ Guía de integración con backend
- **[VERIFICACION-PROYECTO.md](VERIFICACION-PROYECTO.md)** - ✅ Verificación de todos los requisitos implementados

## 📄 Licencia

Propiedad de Digiautomatiza © 2025

---

**Contacto**: digiautomatiza@outlook.com

