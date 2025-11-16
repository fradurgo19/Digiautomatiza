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
// Valores soportados: 'outlook' | 'gmail' | 'resend' | 'sendgrid'
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'outlook').toLowerCase();

let emailClient = null;
let transporter = null;

// Inicializar cliente según el proveedor
if (EMAIL_PROVIDER === 'resend') {
  // RESEND (API)
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    emailClient = new Resend(apiKey);
    console.log('✅ Servidor de Email configurado con RESEND');
  } else {
    // No detenemos la app, pero no se podrá enviar correo hasta que se configure la API key
    console.error('❌ RESEND_API_KEY no está definida en .env. No se podrá enviar correo con Resend.');
  }
} else if (EMAIL_PROVIDER === 'sendgrid') {
  // SENDGRID (SMTP)
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY || '',
    },
  });
  console.log('✅ Servidor de Email configurado con SENDGRID');
} else if (EMAIL_PROVIDER === 'gmail') {
  // GMAIL (SMTP) – requiere 2FA y contraseña de aplicación
  const gmailUser = process.env.EMAIL_USER;
  const gmailPass = process.env.EMAIL_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.error('❌ Faltan EMAIL_USER o EMAIL_PASSWORD en .env para autenticarse con Gmail SMTP');
    console.error('   Define EMAIL_USER=tu_correo@gmail.com y EMAIL_PASSWORD=tu contraseña de aplicación.');
  } else {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    transporter.verify(function (error) {
      if (error) {
        console.error('❌ Error al conectar con Gmail SMTP:', error.message);
        console.log('   Asegúrate de que la verificación en dos pasos está activa y de usar una contraseña de aplicación válida.\n');
      } else {
        console.log('✅ Servidor listo para enviar correos desde Gmail');
      }
    });
  }
} else {
  // OUTLOOK (SMTP)
  const outlookUser = process.env.EMAIL_USER || 'digiautomatiza@outlook.com';
  const outlookPass = process.env.EMAIL_PASSWORD;

  if (!outlookUser || !outlookPass) {
    console.error('❌ Faltan EMAIL_USER o EMAIL_PASSWORD en .env para autenticarse con Outlook SMTP');
    console.error('   Configura EMAIL_USER y EMAIL_PASSWORD (o usa un proveedor como Resend).');
  } else {
    transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: outlookUser,
        pass: outlookPass,
      },
      tls: {
        ciphers: 'SSLv3',
        // En producción, considera poner rejectUnauthorized: true y configurar certificados
        rejectUnauthorized: false,
      },
    });

    transporter.verify(function (error) {
      if (error) {
        console.error('❌ Error al conectar con Outlook SMTP:', error.message);
        console.log('   Revisa tus credenciales o considera usar otro proveedor como Resend.\n');
      } else {
        console.log('✅ Servidor listo para enviar correos desde Outlook');
      }
    });
  }
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

    // Destino del formulario de contacto (siempre hacia el correo de la empresa)
    const emailTo =
      process.env.EMAIL_CONTACTO ||
      process.env.EMAIL_FROM ||
      'digiautomatiza1@gmail.com';
    
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
        <p style="color: gray; font-size: 12px; margin-top: 16px;">
          Este correo fue enviado automáticamente desde el sistema Digiautomatiza.
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
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; background: #0b1720; color: #e5f4ec; padding: 0; border-radius: 24px; overflow: hidden; border: 1px solid rgba(16,94,67,0.35);">
            <!-- Header -->
            <div style="background: radial-gradient(circle at 0 0, rgba(16,185,129,0.25), transparent 55%), radial-gradient(circle at 100% 0, rgba(132,204,22,0.25), transparent 55%), linear-gradient(135deg, #022c22 0%, #020617 100%); padding: 24px 24px 18px; text-align: left; position: relative;">
              <div style="position:absolute; inset:0; opacity:0.25; background-image: radial-gradient(circle at 1px 1px, rgba(16,94,67,0.35) 1px, transparent 0); background-size:14px 14px;"></div>
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px;">
                <img src="https://res.cloudinary.com/dbufrzoda/image/upload/v1760908611/Captura_de_pantalla_2025-10-19_122805_v4gvpt.png" alt="Logo Digiautomatiza" style="height: 52px; width: auto; border-radius: 16px; box-shadow: 0 18px 45px rgba(16,185,129,0.35); margin-bottom: 4px;" />
                <div style="display:block;">
                  <p style="margin: 0 0 4px; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #6ee7b7; display:block;">
                    Suite de Automatización Empresarial
                  </p>
                  <h1 style="margin: 0 0 4px; font-size: 20px; line-height: 1.3; color: #ecfdf5; display:block;">
                    Digiautomatiza
                  </h1>
                  <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #a7f3d0; display:block;">
                    Digitalización • Automatización • Inteligencia de Negocio
                  </p>
                </div>
              </div>
            </div>

            <!-- Body -->
            <div style="padding: 24px 24px 20px; background: radial-gradient(circle at 100% 0, rgba(52,211,153,0.10), transparent 55%), #020617;">
              <div style="padding: 16px 16px 14px; border-radius: 18px; background: rgba(15,118,110,0.08); border: 1px solid rgba(45,212,191,0.18);">
                <p style="margin: 0 0 4px; font-size: 13px; color: #a7f3d0; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;">Mensaje para ti</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #e5f4ec;">
                  ${mensaje.replace(/\n/g, '<br>')}
                </p>
              </div>

              <!-- Servicios -->
              <div style="margin-top: 18px; padding: 14px 16px 16px; border-radius: 18px; background: rgba(15,23,42,0.85); border: 1px solid rgba(15,118,110,0.55);">
                <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: #6ee7b7; font-weight: 600;">Servicios clave</p>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #d1fae5; line-height: 1.7;">
                  <li><strong style="color:#6ee7b7;">Páginas Web de Alto Impacto</strong>: sitios modernos, rápidos y optimizados para conversión.</li>
                  <li><strong style="color:#6ee7b7;">Aplicaciones Web & Power Apps</strong>: digitalización de procesos críticos end-to-end.</li>
                  <li><strong style="color:#6ee7b7;">Chatbots con IA & Agentes</strong>: atención inteligente en canales digitales 24/7.</li>
                  <li><strong style="color:#6ee7b7;">Automatización con n8n / Power Automate</strong>: flujos orquestados entre SAP, ERP, CRM, Excel y más.</li>
                  <li><strong style="color:#6ee7b7;">Analítica & Power BI</strong>: tableros ejecutivos y monitoreo en tiempo real.</li>
                  <li><strong style="color:#6ee7b7;">Soporte SAP ERP & HANA + Excel → SAP HANA</strong>: automatizaciones avanzadas y reducción de errores operativos.</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="margin-top: 18px; text-align: center;">
                <a href="mailto:digiautomatiza1@gmail.com" style="display: inline-block; padding: 10px 24px; border-radius: 999px; background: linear-gradient(135deg, #22c55e, #84cc16); color: #022c22; font-size: 13px; font-weight: 700; text-decoration: none; box-shadow: 0 15px 35px rgba(34,197,94,0.3);">
                  Agenda una sesión con nuestro equipo
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding: 14px 20px 16px; background: #020617; border-top: 1px solid rgba(15,23,42,0.9); text-align: center;">
              <p style="margin: 0 0 2px; font-size: 11px; color: #64748b;">
                Digiautomatiza · Laboratorio de Innovación · LATAM
              </p>
              <p style="margin: 0 0 2px; font-size: 11px; color: #6ee7b7;">
                📧 <span style="color:#bbf7d0;">digiautomatiza1@gmail.com</span> · 📱 <span style="color:#bbf7d0;">+57 314 331 5108</span>
              </p>
              <p style="margin: 4px 0 0; font-size: 10px; color: #475569;">
                Digitalización • Automatización • Inteligencia de Negocio
              </p>
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

