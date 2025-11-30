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

