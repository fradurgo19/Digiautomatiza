/**
 * Servidor de Email para Digiautomatiza
 * Soporta múltiples proveedores: Resend, Outlook, SendGrid
 */

// Cargar variables de entorno desde .env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const { Resend } = require('resend');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar multer para archivos adjuntos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Configuración del proveedor de email
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'outlook'; // resend | outlook | sendgrid

let emailClient = null;
let transporter = null;

// Inicializar cliente según el proveedor
if (EMAIL_PROVIDER === 'resend') {
  // RESEND
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    emailClient = new Resend(apiKey);
    console.log('✅ Configurado con Resend');
    console.log(`✅ API Key: ${apiKey.substring(0, 8)}...`);
  } else {
    console.error('❌ RESEND_API_KEY no configurada');
  }
} else if (EMAIL_PROVIDER === 'sendgrid') {
  // SENDGRID (con nodemailer)
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY || ''
    }
  });
  console.log('✅ Configurado con SendGrid');
} else {
  // OUTLOOK (default)
  transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'digiautomatiza@outlook.com',
      pass: process.env.EMAIL_PASSWORD || 'Panela7760*'
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });
  
  // Verificar conexión
  transporter.verify(function (error, success) {
    if (error) {
      console.error('❌ Error al conectar con Outlook:', error.message);
      console.log('\n💡 Sugerencia: Usa Resend para configuración más fácil');
      console.log('   Lee: GUIA-CONFIGURAR-EMAIL.md\n');
    } else {
      console.log('✅ Servidor listo para enviar correos desde Outlook');
    }
  });
}

// Función para enviar email según el proveedor
async function enviarEmail(opciones) {
  const { to, subject, html, from, attachments } = opciones;
  
  if (EMAIL_PROVIDER === 'resend' && emailClient) {
    // Enviar con Resend
    const resultado = await emailClient.emails.send({
      from: from || process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    return resultado;
  } else if (transporter) {
    // Enviar con Nodemailer (Outlook/SendGrid)
    const mailOptions = {
      from: from || process.env.EMAIL_FROM || 'digiautomatiza@outlook.com',
      to,
      subject,
      html,
      attachments
    };
    return await transporter.sendMail(mailOptions);
  } else {
    throw new Error('No hay cliente de email configurado');
  }
}

// Endpoint de prueba
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor de Email Digiautomatiza funcionando',
    email: 'digiautomatiza@outlook.com'
  });
});

// Endpoint para enviar correo único (formulario de contacto)
app.post('/api/email/contacto', async (req, res) => {
  try {
    const { nombre, email, telefono, empresa, servicio, mensaje } = req.body;

    const emailTo = process.env.EMAIL_FROM || 'digiautomatiza@outlook.com';
    
    const info = await enviarEmail({
      to: emailTo,
      subject: `📧 Nuevo Contacto: ${servicio} - ${nombre}`,
      html: `
        <h2>📬 Nuevo Contacto desde la Web</h2>
        <hr>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        ${empresa ? `<p><strong>Empresa:</strong> ${empresa}</p>` : ''}
        <p><strong>Servicio de Interés:</strong> ${servicio}</p>
        <hr>
        <h3>Mensaje:</h3>
        <p>${mensaje}</p>
        <hr>
        <p style="color: gray; font-size: 12px;">
          Este correo fue enviado automáticamente desde el sistema Digiautomatiza
        </p>
      `
    });
    
    console.log('✅ Correo de contacto enviado:', info.id || info.messageId);

    res.json({
      success: true,
      message: 'Correo enviado exitosamente',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('❌ Error al enviar correo de contacto:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para envío masivo de correos
app.post('/api/email/envio-masivo', upload.array('archivos'), async (req, res) => {
  try {
    const { destinatarios, asunto, mensaje } = req.body;
    const archivos = req.files || [];

    // Parsear destinatarios si viene como string
    const listaDestinatarios = typeof destinatarios === 'string' 
      ? JSON.parse(destinatarios) 
      : destinatarios;

    console.log(`📧 Enviando correos masivos a ${listaDestinatarios.length} destinatarios...`);

    const resultados = {
      exitosos: [],
      fallidos: []
    };

    // Preparar adjuntos si existen
    const adjuntos = archivos.map(file => ({
      filename: file.originalname,
      content: file.buffer
    }));

    // Enviar un correo a cada destinatario
    for (const destinatario of listaDestinatarios) {
      try {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🚀 Digiautomatiza</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              ${mensaje.replace(/\n/g, '<br>')}
            </div>
            <div style="padding: 15px; background: #333; color: white; text-align: center; font-size: 12px;">
              <p style="margin: 5px 0;">Digiautomatiza - Digitalización • Automatización • Innovación</p>
              <p style="margin: 5px 0;">📧 digiautomatiza@outlook.com</p>
            </div>
          </div>
        `;

        const info = await enviarEmail({
          to: destinatario,
          subject: asunto,
          html: htmlContent,
          attachments: adjuntos
        });
        
        resultados.exitosos.push(destinatario);
        console.log(`✅ Enviado a ${destinatario}`);

        // Pequeña pausa entre envíos
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        resultados.fallidos.push({
          email: destinatario,
          error: error.message
        });
        console.error(`❌ Error al enviar a ${destinatario}:`, error.message);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Exitosos: ${resultados.exitosos.length}`);
    console.log(`   ❌ Fallidos: ${resultados.fallidos.length}`);

    res.json({
      success: true,
      resultados: resultados,
      total: listaDestinatarios.length,
      exitosos: resultados.exitosos.length,
      fallidos: resultados.fallidos.length
    });
  } catch (error) {
    console.error('❌ Error en envío masivo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   Servidor de Email Digiautomatiza`);
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Proveedor: ${EMAIL_PROVIDER.toUpperCase()}`);
  console.log(`   Email: ${process.env.EMAIL_FROM || 'digiautomatiza@outlook.com'}`);
  console.log('========================================\n');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promesa rechazada:', error);
});

