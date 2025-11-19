// Vercel Serverless Function - Envío masivo de WhatsApp vía YCloud
import { sendWhatsAppMessageYCloud } from '../../server/whatsappProviderYCloud.js';

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
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { numeros, mensaje } = req.body || {};

    if (!numeros || !mensaje) {
      res.status(400).json({ error: 'Faltan parámetros: numeros y mensaje son obligatorios' });
      return;
    }

    const listaNumeros = Array.isArray(numeros) ? numeros : JSON.parse(numeros);

    if (!Array.isArray(listaNumeros) || listaNumeros.length === 0) {
      res.status(400).json({ error: 'Debes enviar al menos un número de destino' });
      return;
    }

    const exitosos = [];
    const fallidos = [];

    for (const numero of listaNumeros) {
      try {
        await sendWhatsAppMessageYCloud({
          to: numero,
          body: mensaje,
        });
        exitosos.push(numero);
      } catch (error) {
        console.error(`Error al enviar WhatsApp a ${numero}:`, error);
        fallidos.push({
          numero,
          error: error.message || 'Error desconocido al enviar mensaje',
        });
      }
    }

    res.status(200).json({ exitosos, fallidos });
  } catch (error) {
    console.error('Error en /api/whatsapp/enviar-masivo:', error);
    res.status(500).json({ error: 'Error al procesar envío masivo de WhatsApp' });
  }
}


