// Vercel Serverless Function - Envío Masivo de Correos
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Configuración del proveedor de email
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'outlook').toLowerCase();

// Inicializar cliente según el proveedor
let emailClient = null;
let transporter = null;

if (EMAIL_PROVIDER === 'resend') {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    emailClient = new Resend(apiKey);
    console.log('✅ Email configurado con RESEND');
  }
} else if (EMAIL_PROVIDER === 'sendgrid') {
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY || '',
    },
  });
  console.log('✅ Email configurado con SENDGRID');
} else if (EMAIL_PROVIDER === 'gmail') {
  const gmailUser = process.env.EMAIL_USER;
  const gmailPass = process.env.EMAIL_PASSWORD;
  if (gmailUser && gmailPass) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    console.log('✅ Email configurado con GMAIL');
  }
} else {
  // OUTLOOK (default)
  const outlookUser = process.env.EMAIL_USER || 'digiautomatiza@outlook.com';
  const outlookPass = process.env.EMAIL_PASSWORD;
  if (outlookUser && outlookPass) {
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
        rejectUnauthorized: false,
      },
    });
    console.log('✅ Email configurado con OUTLOOK');
  }
}

// Función para enviar email según el proveedor
async function enviarEmail(opciones) {
  const { to, subject, html, from, attachments } = opciones;
  
  if (EMAIL_PROVIDER === 'resend' && emailClient) {
    const resultado = await emailClient.emails.send({
      from: from || process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments,
    });
    return resultado;
  } else if (transporter) {
    // Determinar el remitente según el proveedor
    let defaultFrom = 'digiautomatiza@outlook.com';
    if (EMAIL_PROVIDER === 'gmail') {
      defaultFrom = process.env.EMAIL_USER || 'digiautomatiza1@gmail.com';
    } else if (EMAIL_PROVIDER === 'outlook') {
      defaultFrom = process.env.EMAIL_USER || 'digiautomatiza@outlook.com';
    }
    
    const mailOptions = {
      from: from || process.env.EMAIL_FROM || defaultFrom,
      to,
      subject,
      html,
      attachments
    };
    return await transporter.sendMail(mailOptions);
  } else {
    throw new Error('No hay cliente de email configurado. Verifica EMAIL_PROVIDER, EMAIL_USER y EMAIL_PASSWORD');
  }
}

// Configurar CORS
function setCORSHeaders(res, req) {
  const allowedOrigins = [
    'https://www.digiautomatiza.co',
    'https://digiautomatiza.co',
    'https://digiautomatiza.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const origin = req.headers?.origin || req.headers?.referer?.split('/').slice(0, 3).join('/');
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
}

// Parsear FormData usando el API nativo (compatible con Vercel)
async function parseFormData(req) {
  // En Vercel, el body ya viene parseado si es JSON
  // Si es FormData, necesitamos parsearlo manualmente
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('application/json')) {
    // Si viene como JSON (fallback)
    return req.body;
  }

  // Para FormData, necesitamos usar una librería o parsear manualmente
  // Por ahora, vamos a aceptar JSON como alternativa
  // El frontend puede enviar JSON en lugar de FormData si hay problemas
  if (req.body && typeof req.body === 'object') {
    return {
      destinatarios: typeof req.body.destinatarios === 'string' 
        ? JSON.parse(req.body.destinatarios) 
        : req.body.destinatarios,
      asunto: req.body.asunto || '',
      mensaje: req.body.mensaje || '',
      archivos: [], // Los archivos se manejarán después si es necesario
    };
  }

  throw new Error('No se pudo parsear el body de la petición');
}

export default async function handler(req, res) {
  setCORSHeaders(res, req);

  // Manejar preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Parsear datos - En Vercel, el body puede venir como string o ya parseado
    let bodyData = req.body;
    
    // Si el body es un string, parsearlo como JSON
    if (typeof bodyData === 'string') {
      try {
        bodyData = JSON.parse(bodyData);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Body inválido: no es un JSON válido'
        });
      }
    }
    
    // Extraer datos
    const destinatarios = Array.isArray(bodyData.destinatarios) 
      ? bodyData.destinatarios 
      : (typeof bodyData.destinatarios === 'string' 
          ? JSON.parse(bodyData.destinatarios) 
          : []);
    const asunto = bodyData.asunto || '';
    const mensaje = bodyData.mensaje || '';
    const archivos = bodyData.archivos || [];

    if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos un destinatario'
      });
    }

    if (!asunto || !mensaje) {
      return res.status(400).json({
        success: false,
        error: 'Asunto y mensaje son requeridos'
      });
    }

    console.log(`📧 Enviando correos masivos a ${destinatarios.length} destinatarios...`);

    const resultados = {
      exitosos: [],
      fallidos: []
    };

    // Preparar adjuntos si existen
    // Nota: En Vercel Serverless Functions, el manejo de archivos es limitado
    // Por ahora, los adjuntos se omiten. Si se necesitan, considerar usar Supabase Storage
    const attachments = [];
    // TODO: Implementar manejo de archivos con Supabase Storage si es necesario

    // Enviar correo a cada destinatario
    for (const destinatario of destinatarios) {
      try {
        const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f0fdf4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0fdf4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(5, 150, 105, 0.1);">
          
          <!-- Header con Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); padding: 40px 30px; text-align: center; position: relative;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1; background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0); background-size: 20px 20px;"></div>
              <div style="position: relative; z-index: 1;">
                <img src="https://res.cloudinary.com/dbufrzoda/image/upload/v1760908611/Captura_de_pantalla_2025-10-19_122805_v4gvpt.png" alt="Digiautomatiza Logo" style="height: 80px; width: auto; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);" />
                <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                  Digiautomatiza
                </h1>
                <p style="margin: 0; font-size: 13px; color: #d1fae5; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 500;">
                  Innovación Digital • Transformando Ideas en Soluciones
                </p>
              </div>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              
              <!-- Mensaje Personalizado -->
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #047857; letter-spacing: 0.5px; text-transform: uppercase;">
                  Mensaje para ti
                </p>
                <div style="font-size: 16px; line-height: 1.7; color: #1f2937;">
                  ${mensaje.replace(/\n/g, '<br>')}
                </div>
              </div>

              <!-- Servicios -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
                <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #047857; display: flex; align-items: center; gap: 8px;">
                  <span style="display: inline-block; width: 4px; height: 24px; background: linear-gradient(180deg, #10b981 0%, #84cc16 100%); border-radius: 2px;"></span>
                  Nuestros Servicios
                </h2>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.6;">
                        <strong style="color: #059669;">🌐 Páginas Web</strong><br>
                        <span style="color: #6b7280; font-size: 14px;">Diseño y desarrollo de sitios web modernos, responsivos y optimizados para SEO</span>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.6;">
                        <strong style="color: #059669;">💻 Aplicaciones Web</strong><br>
                        <span style="color: #6b7280; font-size: 14px;">Desarrollo con Power Apps, React, Node.js, TypeScript y Java</span>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.6;">
                        <strong style="color: #059669;">🤖 Chatbot con IA</strong><br>
                        <span style="color: #6b7280; font-size: 14px;">Construcción de chatbots inteligentes con agentes de IA para atención 24/7</span>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.6;">
                        <strong style="color: #059669;">⚙️ Automatización</strong><br>
                        <span style="color: #6b7280; font-size: 14px;">Procesos empresariales con N8N y Power Automate</span>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.6;">
                        <strong style="color: #059669;">📊 Análisis de Datos</strong><br>
                        <span style="color: #6b7280; font-size: 14px;">Visualización y análisis empresarial con Power BI</span>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.6;">
                        <strong style="color: #059669;">🏭 Soporte SAP ERP & HANA</strong><br>
                        <span style="color: #6b7280; font-size: 14px;">Automatización conectando Excel, SAP ERP y SAP HANA</span>
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="mailto:digiautomatiza1@gmail.com?subject=Consulta%20de%20Servicios" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #84cc16 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">
                  📅 Agenda una Sesión con Nosotros
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 30px; text-align: center; border-top: 1px solid #d1fae5;">
              <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #047857;">
                Digiautomatiza
              </p>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #059669;">
                📧 <a href="mailto:digiautomatiza1@gmail.com" style="color: #059669; text-decoration: none;">digiautomatiza1@gmail.com</a>
              </p>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #059669;">
                📱 <a href="tel:+573143315108" style="color: #059669; text-decoration: none;">+57 314 331 5108</a>
              </p>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">
                🌐 <a href="https://www.digiautomatiza.co" style="color: #6b7280; text-decoration: none;">www.digiautomatiza.co</a>
              </p>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                Digitalización • Automatización • Inteligencia de Negocio<br>
                <span style="color: #d1d5db;">© ${new Date().getFullYear()} Digiautomatiza. Todos los derechos reservados.</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        const info = await enviarEmail({
          to: destinatario,
          subject: asunto,
          html: htmlContent,
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        resultados.exitosos.push(destinatario);
        console.log(`✅ Enviado a ${destinatario}`);

        // Pequeña pausa entre envíos para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        resultados.fallidos.push({
          email: destinatario,
          error: error.message || 'Error desconocido'
        });
        console.error(`❌ Error al enviar a ${destinatario}:`, error.message);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Exitosos: ${resultados.exitosos.length}`);
    console.log(`   ❌ Fallidos: ${resultados.fallidos.length}`);

    res.status(200).json({
      success: true,
      resultados: resultados,
      total: destinatarios.length,
      exitosos: resultados.exitosos.length,
      fallidos: resultados.fallidos.length
    });
  } catch (error) {
    console.error('❌ Error en envío masivo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar el envío masivo'
    });
  }
}

