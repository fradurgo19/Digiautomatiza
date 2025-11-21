// Vercel Serverless Function - Webhook de YCloud para recibir actualizaciones de mensajes
// Este endpoint recibe notificaciones de YCloud sobre el estado de los mensajes enviados
import { setCORSHeaders } from '../lib/cors.js';

export default async function handler(req, res) {
  try {
    setCORSHeaders(req, res);
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Permitir GET para verificar que el endpoint está activo
    if (req.method === 'GET') {
      res.status(200).json({ 
        status: 'active',
        endpoint: '/api/whatsapp/webhook',
        message: 'Webhook endpoint está activo y listo para recibir eventos de YCloud',
        webhookId: '691fce65bc05db477e0587bf'
      });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const webhookData = req.body;
    
    console.log('📥 Webhook recibido de YCloud:', JSON.stringify(webhookData, null, 2));

    // YCloud envía diferentes tipos de eventos según lo configurado en el webhook
    // Ver documentación: https://docs.ycloud.com/reference/webhook-events
    
    const eventType = webhookData.type || webhookData.event || 'unknown';
    
    switch (eventType) {
      case 'whatsapp.message.updated':
        // Actualización del estado de un mensaje (MÁS IMPORTANTE)
        const { id: messageId, status, to, from, error } = webhookData.data || webhookData;
        
        console.log(`📊 Estado del mensaje actualizado:`, {
          messageId,
          status, // accepted, sent, delivered, read, failed
          to,
          from,
          error: error?.message || null,
          timestamp: new Date().toISOString()
        });

        // Estados posibles:
        // - accepted: Mensaje aceptado por YCloud
        // - sent: Mensaje enviado a WhatsApp
        // - delivered: Mensaje entregado al dispositivo
        // - read: Mensaje leído por el usuario
        // - failed: Mensaje fallido
        
        if (status === 'failed') {
          console.error(`❌ Mensaje fallido - ID: ${messageId}, Para: ${to}`);
          if (error) {
            console.error(`❌ Error: ${error.message || JSON.stringify(error)}`);
          }
          // Aquí podrías guardar el error en la base de datos o notificar al usuario
        } else if (status === 'delivered') {
          console.log(`✅ Mensaje entregado - ID: ${messageId}, Para: ${to}`);
        } else if (status === 'read') {
          console.log(`👁️ Mensaje leído - ID: ${messageId}, Para: ${to}`);
        } else if (status === 'sent') {
          console.log(`📤 Mensaje enviado - ID: ${messageId}, Para: ${to}`);
        }
        break;

      case 'whatsapp.inbound_message.received':
        // Mensaje recibido del usuario
        const inboundData = webhookData.data || webhookData;
        console.log('📨 Mensaje recibido de usuario:', {
          from: inboundData.from,
          to: inboundData.to,
          messageId: inboundData.id,
          message: inboundData.text?.body || inboundData.body || 'Sin texto',
          timestamp: new Date().toISOString()
        });
        // Aquí podrías procesar el mensaje entrante y responder automáticamente
        break;

      case 'whatsapp.phone_number.quality_updated':
        // Actualización de la calidad del número de WhatsApp
        const qualityData = webhookData.data || webhookData;
        console.log('📱 Calidad del número actualizada:', {
          phoneNumber: qualityData.phoneNumber || qualityData.number,
          qualityRating: qualityData.qualityRating,
          qualityScore: qualityData.qualityScore,
          timestamp: new Date().toISOString()
        });
        // Importante: Si la calidad baja, WhatsApp puede limitar el envío
        break;

      case 'whatsapp.template.reviewed':
        // Plantilla revisada/aprobada por WhatsApp
        const templateData = webhookData.data || webhookData;
        console.log('📋 Plantilla revisada:', {
          templateName: templateData.name,
          status: templateData.status, // approved, rejected
          timestamp: new Date().toISOString()
        });
        break;

      case 'whatsapp.business_account.updated':
        // Actualización de la cuenta de negocio
        console.log('🏢 Cuenta de negocio actualizada');
        break;

      case 'whatsapp.phone_number.name_updated':
        // Nombre del número actualizado
        console.log('📝 Nombre del número actualizado');
        break;

      default:
        console.log(`📋 Evento no manejado específicamente: ${eventType}`);
        console.log('📋 Datos completos:', JSON.stringify(webhookData, null, 2));
    }

    // YCloud espera una respuesta 200 para confirmar que recibimos el webhook
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Error procesando webhook de YCloud:', error);
    setCORSHeaders(req, res);
    res.status(500).json({ 
      error: error.message || 'Error interno del servidor'
    });
  }
}

