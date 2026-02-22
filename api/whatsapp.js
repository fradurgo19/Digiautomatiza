// Vercel Serverless Function - WhatsApp Unificado (Envío Masivo + Webhook)
import { setCORSHeaders } from './lib/cors.mjs';

function formatearNumeroWhatsApp(numero) {
  let numeroLimpio = String(numero).replaceAll(/[\s()-]/g, '');
  if (!numeroLimpio.startsWith('+')) {
    numeroLimpio = '+' + numeroLimpio;
  }
  return numeroLimpio;
}

function handleWebhook(webhookData, res) {
  console.log('📥 Webhook recibido de YCloud:', JSON.stringify(webhookData, null, 2));
  const eventType = webhookData.type || webhookData.event || 'unknown';
  switch (eventType) {
    case 'whatsapp.message.updated': {
      const messageData = webhookData.whatsappMessage || webhookData.data || webhookData;
      const messageId = messageData.id || webhookData.id;
      const status = messageData.status;
      const to = messageData.to;
      const errorCode = messageData.errorCode;
      console.log(`📊 Estado del mensaje actualizado:`, {
        messageId,
        wamid: messageData.wamid,
        status,
        to,
        from: messageData.from,
        errorCode,
        errorMessage: messageData.errorMessage,
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
    }
    case 'whatsapp.inbound_message.received': {
      const inboundData = webhookData.data || webhookData;
      console.log('📨 Mensaje recibido de usuario:', {
        from: inboundData.from,
        to: inboundData.to,
        messageId: inboundData.id,
        message: inboundData.text?.body || inboundData.body || 'Sin texto',
      });
      break;
    }
    default:
      console.log(`📋 Evento: ${eventType}`);
  }
  return res.status(200).json({ received: true });
}

function buildPayloadTemplate(YCLOUD_WHATSAPP_NUMBER, numeroFormateado, nombrePlantilla, idiomaPlantilla, YCLOUD_TEMPLATE_LANGUAGE_DEFAULT, parametrosPlantilla) {
  const payload = {
    from: YCLOUD_WHATSAPP_NUMBER,
    to: numeroFormateado,
    type: 'template',
    template: {
      name: nombrePlantilla,
      language: { code: idiomaPlantilla || YCLOUD_TEMPLATE_LANGUAGE_DEFAULT },
    },
  };
  if (parametrosPlantilla && Array.isArray(parametrosPlantilla) && parametrosPlantilla.length > 0) {
    payload.template.components = [
      { type: 'body', parameters: parametrosPlantilla.map(param => ({ type: 'text', text: String(param) })) },
    ];
  }
  return payload;
}

function buildPayloadEnvio(numeroFormateado, opts) {
  const base = opts.usarPlantilla && opts.nombrePlantilla
    ? buildPayloadTemplate(opts.YCLOUD_WHATSAPP_NUMBER, numeroFormateado, opts.nombrePlantilla, opts.idiomaPlantilla, opts.YCLOUD_TEMPLATE_LANGUAGE_DEFAULT, opts.parametrosPlantilla)
    : {
        from: opts.YCLOUD_WHATSAPP_NUMBER,
        to: numeroFormateado,
        type: 'text',
        text: { body: opts.mensaje },
      };
  if (opts.archivos?.length > 0 && opts.archivos[0].url) {
    const payload = { ...base };
    payload.type = opts.archivos[0].type || 'image';
    payload[payload.type] = { link: opts.archivos[0].url, caption: opts.mensaje };
    delete payload.text;
    return payload;
  }
  return base;
}

async function enviarUnMensaje(numero, opts) {
  const numeroFormateado = formatearNumeroWhatsApp(numero);
  const payload = buildPayloadEnvio(numeroFormateado, opts);
  const response = await fetch(opts.YCLOUD_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': opts.YCLOUD_API_KEY },
    body: JSON.stringify(payload),
  });
  const responseData = await response.json().catch(() => ({}));
  if (response.ok) {
    return { success: true, numero };
  }
  const errorMessage = responseData.error?.message || responseData.message || `Error ${response.status}: ${response.statusText}`;
  return { success: false, numero, error: errorMessage };
}

function validarBodyEnvio(body) {
  const { numeros, mensaje, usarPlantilla, nombrePlantilla } = body;
  if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
    return { error: 'Se requiere al menos un número de teléfono', status: 400 };
  }
  if (usarPlantilla && (!nombrePlantilla || nombrePlantilla.trim().length === 0)) {
    return { error: 'Si usas plantilla, debes proporcionar el nombre de la plantilla', status: 400 };
  }
  if (!usarPlantilla && (!mensaje || mensaje.trim().length === 0)) {
    return { error: 'El mensaje es requerido cuando no se usa plantilla', status: 400 };
  }
  return null;
}

async function handleEnvioMasivo(req, res) {
  const validationError = validarBodyEnvio(req.body);
  if (validationError) {
    return res.status(validationError.status).json({ error: validationError.error });
  }
  const YCLOUD_API_KEY = process.env.YCLOUD_API_KEY || '';
  const YCLOUD_WHATSAPP_NUMBER = process.env.YCLOUD_WHATSAPP_NUMBER || '';
  if (!YCLOUD_API_KEY || !YCLOUD_WHATSAPP_NUMBER) {
    return res.status(500).json({ error: 'Configuración incompleta: YCLOUD_API_KEY y YCLOUD_WHATSAPP_NUMBER requeridos' });
  }
  const { numeros, mensaje, archivos, usarPlantilla, nombrePlantilla, idiomaPlantilla, parametrosPlantilla } = req.body;
  const opts = {
    YCLOUD_API_KEY,
    YCLOUD_WHATSAPP_NUMBER,
    YCLOUD_API_URL: process.env.YCLOUD_API_URL || 'https://api.ycloud.com/v2/whatsapp/messages',
    YCLOUD_TEMPLATE_LANGUAGE_DEFAULT: process.env.YCLOUD_TEMPLATE_LANGUAGE || 'es_CO',
    mensaje,
    archivos,
    usarPlantilla,
    nombrePlantilla,
    idiomaPlantilla,
    parametrosPlantilla,
  };
  const exitosos = [];
  const fallidos = [];
  console.log(`📤 Enviando ${numeros.length} mensajes de WhatsApp con YCloud`);
  for (const numero of numeros) {
    try {
      const result = await enviarUnMensaje(numero, opts);
      if (result.success) exitosos.push(result.numero);
      else fallidos.push({ numero: result.numero, error: result.error });
    } catch (error) {
      fallidos.push({ numero, error: error instanceof Error ? error.message : 'Error desconocido' });
    }
    if (numeros.length > 1) await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(`📊 Resultado: ${exitosos.length} exitosos, ${fallidos.length} fallidos`);
  return res.status(200).json({ exitosos, fallidos, total: numeros.length, exitososCount: exitosos.length, fallidosCount: fallidos.length });
}

export default async function handler(req, res) {
  try {
    setCORSHeaders(req, res);
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    if (req.method === 'POST' && (req.body?.type || req.body?.event)) {
      return handleWebhook(req.body, res);
    }
    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'active',
        endpoint: '/api/whatsapp',
        message: 'Endpoint de WhatsApp activo (envío masivo y webhook)'
      });
    }
    if (req.method === 'POST' && req.body?.numeros) {
      return await handleEnvioMasivo(req, res);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Error en /api/whatsapp:', error);
    setCORSHeaders(req, res);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

