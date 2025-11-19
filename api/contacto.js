// Vercel Serverless Function - Formulario de Contacto
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Configurar CORS
  // Orígenes permitidos
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

    // Enviar email con Resend
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'digiautomatiza1@gmail.com',
      to: process.env.EMAIL_CONTACTO || process.env.EMAIL_USER || 'digiautomatiza1@gmail.com',
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
      id: data.id
    });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ error: error.message });
  }
}

