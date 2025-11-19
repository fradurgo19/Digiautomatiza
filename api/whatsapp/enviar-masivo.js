// Vercel Serverless Function - Envío Masivo de WhatsApp con YCloud
import { setCORSHeaders } from '../lib/cors.js';

function formatearNumeroWhatsApp(numero) {
  // Remover espacios y caracteres especiales
  let numeroLimpio = numero.replace(/[\s()-]/g, '');
  
  // Si no tiene +, agregarlo
  if (!numeroLimpio.startsWith('+')) {
    numeroLimpio = '+' + numeroLimpio;
  }
  
  return numeroLimpio;
}

export default async function handler(req, res) {
  try {
    setCORSHeaders(req, res);
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { numeros, mensaje, archivos } = req.body;

    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
      res.status(400).json({ error: 'Se requiere al menos un número de teléfono' });
      return;
    }

    if (!mensaje || mensaje.trim().length === 0) {
      res.status(400).json({ error: 'El mensaje es requerido' });
      return;
    }

    // Variables de entorno de YCloud
    const YCLOUD_API_KEY = process.env.YCLOUD_API_KEY || '';
    const YCLOUD_WHATSAPP_NUMBER = process.env.YCLOUD_WHATSAPP_NUMBER || '';
    const YCLOUD_API_URL = process.env.YCLOUD_API_URL || 'https://api.ycloud.com/v2/whatsapp/messages';

    if (!YCLOUD_API_KEY) {
      console.error('❌ YCLOUD_API_KEY no configurada');
      res.status(500).json({ 
        error: 'Configuración incompleta: YCLOUD_API_KEY no está configurada en las variables de entorno' 
      });
      return;
    }

    if (!YCLOUD_WHATSAPP_NUMBER) {
      console.error('❌ YCLOUD_WHATSAPP_NUMBER no configurado');
      res.status(500).json({ 
        error: 'Configuración incompleta: YCLOUD_WHATSAPP_NUMBER no está configurado en las variables de entorno' 
      });
      return;
    }

    const exitosos = [];
    const fallidos = [];

    console.log(`📤 Enviando ${numeros.length} mensajes de WhatsApp con YCloud`);

    // Enviar mensajes uno por uno (YCloud procesa mensajes individualmente)
    for (const numero of numeros) {
      try {
        const numeroFormateado = formatearNumeroWhatsApp(numero);
        
        // Preparar payload para YCloud
        const payload = {
          from: YCLOUD_WHATSAPP_NUMBER,
          to: numeroFormateado,
          type: 'text',
          text: {
            body: mensaje,
          },
        };

        // Si hay archivos, agregar media (YCloud soporta imágenes, videos, documentos, audio)
        if (archivos && archivos.length > 0) {
          // Nota: Para archivos, primero deben estar subidos a un servidor público
          // YCloud requiere URLs públicas para los archivos
          const primerArchivo = archivos[0];
          
          // Si el archivo es una URL, usarla directamente
          if (primerArchivo.url) {
            payload.type = primerArchivo.type || 'image'; // image, video, document, audio
            payload[primerArchivo.type || 'image'] = {
              link: primerArchivo.url,
              caption: mensaje, // El mensaje como caption del archivo
            };
            delete payload.text; // Eliminar text si hay media
          } else {
            console.warn(`⚠️ Archivo sin URL pública para ${numero}. Se enviará solo texto.`);
          }
        }

        const response = await fetch(YCLOUD_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': YCLOUD_API_KEY,
          },
          body: JSON.stringify(payload),
        });

        const responseData = await response.json().catch(() => ({}));

        if (response.ok) {
          console.log(`✅ Mensaje enviado exitosamente a ${numeroFormateado}`);
          exitosos.push(numero);
        } else {
          const errorMessage = responseData.error?.message || 
                              responseData.message || 
                              `Error ${response.status}: ${response.statusText}`;
          console.error(`❌ Error al enviar a ${numeroFormateado}:`, errorMessage);
          fallidos.push({ 
            numero, 
            error: errorMessage 
          });
        }

        // Pequeño delay entre mensajes para evitar rate limiting
        if (numeros.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Error al enviar a ${numero}:`, errorMessage);
        fallidos.push({ 
          numero, 
          error: errorMessage 
        });
      }
    }

    console.log(`📊 Resultado: ${exitosos.length} exitosos, ${fallidos.length} fallidos`);

    res.status(200).json({
      exitosos,
      fallidos,
      total: numeros.length,
      exitososCount: exitosos.length,
      fallidosCount: fallidos.length,
    });

  } catch (error) {
    console.error('❌ Error en /api/whatsapp/enviar-masivo:', error);
    setCORSHeaders(req, res);
    res.status(500).json({ 
      error: error.message || 'Error interno del servidor',
      details: error.stack 
    });
  }
}

