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

    const { numeros, mensaje, archivos, usarPlantilla, nombrePlantilla, parametrosPlantilla } = req.body;

    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
      res.status(400).json({ error: 'Se requiere al menos un número de teléfono' });
      return;
    }

    // Si se usa plantilla, el nombre de la plantilla es requerido
    if (usarPlantilla && (!nombrePlantilla || nombrePlantilla.trim().length === 0)) {
      res.status(400).json({ error: 'Si usas plantilla, debes proporcionar el nombre de la plantilla' });
      return;
    }

    // Si no se usa plantilla, el mensaje es requerido
    if (!usarPlantilla && (!mensaje || mensaje.trim().length === 0)) {
      res.status(400).json({ error: 'El mensaje es requerido cuando no se usa plantilla' });
      return;
    }

    // Variables de entorno de YCloud
    const YCLOUD_API_KEY = process.env.YCLOUD_API_KEY || '';
    const YCLOUD_WHATSAPP_NUMBER = process.env.YCLOUD_WHATSAPP_NUMBER || '';
    const YCLOUD_API_URL = process.env.YCLOUD_API_URL || 'https://api.ycloud.com/v2/whatsapp/messages';
    const YCLOUD_TEMPLATE_LANGUAGE = process.env.YCLOUD_TEMPLATE_LANGUAGE || 'es'; // Idioma de la plantilla (es, en, etc.)

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
    console.log(`🔑 Configuración YCloud:`, {
      apiKey: YCLOUD_API_KEY ? `${YCLOUD_API_KEY.substring(0, 8)}...` : 'NO CONFIGURADA',
      whatsappNumber: YCLOUD_WHATSAPP_NUMBER,
      apiUrl: YCLOUD_API_URL
    });

    // Enviar mensajes uno por uno (YCloud procesa mensajes individualmente)
    for (const numero of numeros) {
      try {
        const numeroFormateado = formatearNumeroWhatsApp(numero);
        
        // Preparar payload para YCloud
        let payload;
        
        if (usarPlantilla && nombrePlantilla) {
          // Usar plantilla (para mensajes fuera de la ventana de 24 horas)
          payload = {
            from: YCLOUD_WHATSAPP_NUMBER,
            to: numeroFormateado,
            type: 'template',
            template: {
              name: nombrePlantilla,
              language: {
                code: YCLOUD_TEMPLATE_LANGUAGE,
              },
            },
          };
          
          // Si hay parámetros para la plantilla, agregarlos
          if (parametrosPlantilla && Array.isArray(parametrosPlantilla) && parametrosPlantilla.length > 0) {
            payload.template.components = [
              {
                type: 'body',
                parameters: parametrosPlantilla.map(param => ({
                  type: 'text',
                  text: String(param),
                })),
              },
            ];
          }
          
          console.log(`📋 Usando plantilla: ${nombrePlantilla} para ${numeroFormateado}`);
        } else {
          // Usar texto libre (solo funciona dentro de la ventana de 24 horas)
          payload = {
            from: YCLOUD_WHATSAPP_NUMBER,
            to: numeroFormateado,
            type: 'text',
            text: {
              body: mensaje,
            },
          };
          
          console.log(`📝 Usando mensaje de texto libre para ${numeroFormateado} (solo funciona dentro de 24h)`);
        }

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

        console.log(`📤 Enviando a ${numeroFormateado} con payload:`, JSON.stringify(payload, null, 2));

        const response = await fetch(YCLOUD_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': YCLOUD_API_KEY,
          },
          body: JSON.stringify(payload),
        });

        const responseData = await response.json().catch(() => ({}));
        
        console.log(`📥 Respuesta de YCloud para ${numeroFormateado}:`, {
          status: response.status,
          statusText: response.statusText,
          data: JSON.stringify(responseData, null, 2)
        });

        if (response.ok) {
          // Verificar si la respuesta contiene información del mensaje
          const messageId = responseData.id || responseData.messageId || responseData.messages?.[0]?.id;
          const messageStatus = responseData.status || responseData.messages?.[0]?.status;
          
          if (messageId) {
            console.log(`✅ Mensaje aceptado por YCloud para ${numeroFormateado} - ID: ${messageId}, Status: ${messageStatus || 'accepted'}`);
            
            // IMPORTANTE: El estado 'accepted' solo significa que YCloud aceptó la solicitud
            // El mensaje puede fallar después si:
            // 1. La ventana de 24 horas está cerrada (necesitas usar plantilla)
            // 2. El número no tiene WhatsApp
            // 3. El número bloqueó tu cuenta
            // 4. No hay créditos suficientes
            
            if (messageStatus === 'accepted' || !messageStatus) {
              console.log(`⚠️ NOTA: El mensaje fue aceptado pero aún no se ha entregado.`);
              console.log(`⚠️ El estado final (sent/delivered/failed) llegará vía webhook.`);
              console.log(`⚠️ Si el mensaje no llega, verifica: ventana de 24h, número verificado, créditos.`);
            }
            
            exitosos.push(numero);
          } else {
            // Si no hay messageId, puede que la respuesta sea exitosa pero incompleta
            console.warn(`⚠️ Respuesta OK pero sin messageId para ${numeroFormateado}. Respuesta:`, responseData);
            exitosos.push(numero);
          }
        } else {
          const errorMessage = responseData.error?.message || 
                              responseData.message || 
                              responseData.error?.code ||
                              `Error ${response.status}: ${response.statusText}`;
          console.error(`❌ Error al enviar a ${numeroFormateado}:`, errorMessage);
          console.error(`📋 Detalles completos del error:`, responseData);
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

