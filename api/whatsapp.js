// Vercel Serverless Function - WhatsApp Unificado (Envío Masivo + Webhook)
import { setCORSHeaders } from './lib/cors.mjs';

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

    // ========== WEBHOOK (POST desde YCloud) ==========
    // Si viene un webhook de YCloud (tiene type o event en el body)
    if (req.method === 'POST' && (req.body?.type || req.body?.event)) {
      const webhookData = req.body;
      
      console.log('📥 Webhook recibido de YCloud:', JSON.stringify(webhookData, null, 2));

      const eventType = webhookData.type || webhookData.event || 'unknown';
      
      switch (eventType) {
        case 'whatsapp.message.updated':
          const messageData = webhookData.whatsappMessage || webhookData.data || webhookData;
          const messageId = messageData.id || webhookData.id;
          const status = messageData.status;
          const to = messageData.to;
          const from = messageData.from;
          const errorCode = messageData.errorCode;
          const errorMessage = messageData.errorMessage;
          
          console.log(`📊 Estado del mensaje actualizado:`, {
            messageId,
            wamid: messageData.wamid,
            status,
            to,
            from,
            errorCode,
            errorMessage,
            timestamp: new Date().toISOString()
          });

          if (status === 'failed') {
            console.error(`❌ Mensaje fallido - ID: ${messageId}, Para: ${to}`);
            if (errorCode === '131047') {
              console.error(`⚠️ PROBLEMA: Ventana de 24 horas cerrada`);
              console.error(`⚠️ SOLUCIÓN: Debes usar una plantilla aprobada`);
            }
          } else if (status === 'delivered') {
            console.log(`✅ Mensaje entregado - ID: ${messageId}, Para: ${to}`);
          } else if (status === 'read') {
            console.log(`👁️ Mensaje leído - ID: ${messageId}, Para: ${to}`);
          } else if (status === 'sent') {
            console.log(`📤 Mensaje enviado - ID: ${messageId}, Para: ${to}`);
          }
          break;

        case 'whatsapp.inbound_message.received':
          const inboundData = webhookData.data || webhookData;
          console.log('📨 Mensaje recibido de usuario:', {
            from: inboundData.from,
            to: inboundData.to,
            messageId: inboundData.id,
            message: inboundData.text?.body || inboundData.body || 'Sin texto',
          });
          break;

        default:
          console.log(`📋 Evento: ${eventType}`);
      }

      return res.status(200).json({ received: true });
    }

    // ========== GET - Verificar endpoint ==========
    if (req.method === 'GET') {
      return res.status(200).json({ 
        status: 'active',
        endpoint: '/api/whatsapp',
        message: 'Endpoint de WhatsApp activo (envío masivo y webhook)'
      });
    }

    // ========== ENVÍO MASIVO (POST con numeros) ==========
    if (req.method === 'POST' && req.body?.numeros) {
      const { numeros, mensaje, archivos, usarPlantilla, nombrePlantilla, idiomaPlantilla, parametrosPlantilla } = req.body;

      if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
        return res.status(400).json({ error: 'Se requiere al menos un número de teléfono' });
      }

      if (usarPlantilla && (!nombrePlantilla || nombrePlantilla.trim().length === 0)) {
        return res.status(400).json({ error: 'Si usas plantilla, debes proporcionar el nombre de la plantilla' });
      }

      if (!usarPlantilla && (!mensaje || mensaje.trim().length === 0)) {
        return res.status(400).json({ error: 'El mensaje es requerido cuando no se usa plantilla' });
      }

      const YCLOUD_API_KEY = process.env.YCLOUD_API_KEY || '';
      const YCLOUD_WHATSAPP_NUMBER = process.env.YCLOUD_WHATSAPP_NUMBER || '';
      const YCLOUD_API_URL = process.env.YCLOUD_API_URL || 'https://api.ycloud.com/v2/whatsapp/messages';
      const YCLOUD_TEMPLATE_LANGUAGE_DEFAULT = process.env.YCLOUD_TEMPLATE_LANGUAGE || 'es_CO';

      if (!YCLOUD_API_KEY || !YCLOUD_WHATSAPP_NUMBER) {
        return res.status(500).json({ 
          error: 'Configuración incompleta: YCLOUD_API_KEY y YCLOUD_WHATSAPP_NUMBER requeridos' 
        });
      }

      const exitosos = [];
      const fallidos = [];

      console.log(`📤 Enviando ${numeros.length} mensajes de WhatsApp con YCloud`);

      for (const numero of numeros) {
        try {
          const numeroFormateado = formatearNumeroWhatsApp(numero);
          
          let payload;
          
          if (usarPlantilla && nombrePlantilla) {
            payload = {
              from: YCLOUD_WHATSAPP_NUMBER,
              to: numeroFormateado,
              type: 'template',
              template: {
                name: nombrePlantilla,
                language: {
                  code: idiomaPlantilla || YCLOUD_TEMPLATE_LANGUAGE_DEFAULT,
                },
              },
            };
            
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
          } else {
            payload = {
              from: YCLOUD_WHATSAPP_NUMBER,
              to: numeroFormateado,
              type: 'text',
              text: {
                body: mensaje,
              },
            };
          }

          if (archivos && archivos.length > 0 && archivos[0].url) {
            payload.type = archivos[0].type || 'image';
            payload[archivos[0].type || 'image'] = {
              link: archivos[0].url,
              caption: mensaje,
            };
            delete payload.text;
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
            const messageId = responseData.id || responseData.messageId || responseData.messages?.[0]?.id;
            if (messageId) {
              exitosos.push(numero);
            } else {
              exitosos.push(numero);
            }
          } else {
            const errorMessage = responseData.error?.message || 
                                responseData.message || 
                                `Error ${response.status}: ${response.statusText}`;
            fallidos.push({ numero, error: errorMessage });
          }

          if (numeros.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          fallidos.push({ numero, error: errorMessage });
        }
      }

      console.log(`📊 Resultado: ${exitosos.length} exitosos, ${fallidos.length} fallidos`);

      return res.status(200).json({
        exitosos,
        fallidos,
        total: numeros.length,
        exitososCount: exitosos.length,
        fallidosCount: fallidos.length,
      });
    }

    // Si no coincide con ninguna ruta
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error en /api/whatsapp:', error);
    setCORSHeaders(req, res);
    return res.status(500).json({ 
      error: error.message || 'Error interno del servidor'
    });
  }
}

