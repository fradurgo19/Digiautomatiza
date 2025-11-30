// Vercel Serverless Function - Formulario de Contacto
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Configuración del proveedor de email (misma lógica que envio-masivo)
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'gmail').toLowerCase();

let emailClient = null;
let transporter = null;

if (EMAIL_PROVIDER === 'resend') {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    emailClient = new Resend(apiKey);
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
  }
}

async function enviarEmail(opciones) {
  const { to, subject, html, from } = opciones;
  
  if (EMAIL_PROVIDER === 'resend' && emailClient) {
    const resultado = await emailClient.emails.send({
      from: from || process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    return resultado;
  } else if (transporter) {
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
    };
    return await transporter.sendMail(mailOptions);
  } else {
    throw new Error('No hay cliente de email configurado. Verifica EMAIL_PROVIDER, EMAIL_USER y EMAIL_PASSWORD');
  }
}

export default async function handler(req, res) {
  // Configurar CORS
  const allowedOrigins = [
    'https://www.digiautomatiza.co',
    'https://digiautomatiza.co',
    'https://digiautomatiza.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nombre, email, telefono, empresa, servicio, mensaje } = req.body;

    const emailTo = process.env.EMAIL_CONTACTO || process.env.EMAIL_USER || 'digiautomatiza1@gmail.com';

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
          Este correo fue enviado automáticamente desde Digiautomatiza
        </p>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Correo enviado exitosamente',
      messageId: info.messageId || info.id
    });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ error: error.message });
  }
}

