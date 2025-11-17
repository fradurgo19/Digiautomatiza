/**
 * Proveedor de WhatsApp basado en YCloud
 *
 * Objetivo:
 * - Centralizar TODAS las llamadas a WhatsApp en un solo módulo.
 * - Mapear los casos de uso del negocio (Digiautomatiza) a los tipos de conversación de WhatsApp.
 * - Conectar la API real de YCloud usando las credenciales de tu cuenta.
 *
 * IMPORTANTE:
 * - Debes configurar en tu `.env` del backend (carpeta `server/`) las variables:
 *   YCLOUD_API_BASE_URL, YCLOUD_API_KEY y YCLOUD_WHATSAPP_BUSINESS_ID
 */

// Tipos de mensaje según la clasificación oficial de WhatsApp
const MessageCategory = {
  AUTHENTICATION: 'authentication', // OTP / login
  MARKETING: 'marketing',           // campañas, ofertas, upsell
  UTILITY: 'utility',               // recordatorios, confirmaciones, avisos
  SERVICE: 'service',               // mensajes de libre formato dentro de ventana de servicio (24h)
};

/**
 * Casos de uso de Digiautomatiza y su categoría principal
 *
 * Puedes ajustar este mapeo según la operación real del área comercial.
 */
const UseCase = {
  // Ej: “Campaña para ofrecer servicios de páginas web, automatización, etc.”
  CAMPAÑA_SERVICIOS: 'CAMPAÑA_SERVICIOS',

  // Ej: “Recordatorio de sesión agendada con el cliente”
  RECORDATORIO_SESION: 'RECORDATORIO_SESION',

  // Ej: “Confirmación de sesión agendada / reprogramación”
  CONFIRMACION_SESION: 'CONFIRMACION_SESION',

  // Ej: “Mensajes de seguimiento dentro de las 24h para dudas del cliente”
  SEGUIMIENTO_DENTRO_24H: 'SEGUIMIENTO_DENTRO_24H',
};

/**
 * Mapea el caso de uso del negocio a la categoría de WhatsApp que usará YCloud.
 *
 * @param {string} useCase - uno de los valores de UseCase
 * @returns {string} - una categoría de MessageCategory
 */
function resolveCategoryForUseCase(useCase) {
  switch (useCase) {
    case UseCase.CAMPAÑA_SERVICIOS:
      return MessageCategory.MARKETING;

    case UseCase.RECORDATORIO_SESION:
    case UseCase.CONFIRMACION_SESION:
      return MessageCategory.UTILITY;

    case UseCase.SEGUIMIENTO_DENTRO_24H:
      return MessageCategory.SERVICE;

    default:
      // Por defecto, utilizamos SERVICE para no forzar plantillas si estás en ventana de 24h
      return MessageCategory.SERVICE;
  }
}

/**
 * Configuración base para YCloud.
 * Completa estas variables en tu `.env` del backend (`server/.env`):
 *
 *  YCLOUD_API_BASE_URL=https://api.ycloud.com
 *  YCLOUD_API_KEY=tu_api_key_de_ycloud
 *  YCLOUD_WHATSAPP_BUSINESS_ID=tu_business_id_o_canal
 *
 * Revisa en el panel de YCloud cuál es la URL base y el endpoint exacto. El valor
 * por defecto que usamos abajo es el más habitual:
 *   https://api.ycloud.com/v1/whatsapp/messages
 */
const YCLOUD_API_BASE_URL = process.env.YCLOUD_API_BASE_URL || 'https://api.ycloud.com';
const YCLOUD_API_KEY = process.env.YCLOUD_API_KEY || '';
const YCLOUD_WHATSAPP_BUSINESS_ID = process.env.YCLOUD_WHATSAPP_BUSINESS_ID || '';
// Número de WhatsApp como alternativa si no hay business_id
const YCLOUD_WHATSAPP_NUMBER = process.env.YCLOUD_WHATSAPP_NUMBER || '15558366820';

function ensureConfigured() {
  if (!YCLOUD_API_KEY) {
    throw new Error(
      'YCloud no está configurado. Define YCLOUD_API_KEY en .env (mínimo requerido)'
    );
  }
  
  // El business_id es opcional - si no está, intentaremos usar el número
  if (!YCLOUD_WHATSAPP_BUSINESS_ID && !YCLOUD_WHATSAPP_NUMBER) {
    console.warn('⚠️ No se encontró YCLOUD_WHATSAPP_BUSINESS_ID ni YCLOUD_WHATSAPP_NUMBER. Intentando sin business_id...');
  }
}

/**
 * Enviar mensaje de WhatsApp a través de YCloud.
 *
 * Esta función está diseñada para soportar:
 * - Mensajes de plantilla (authentication / marketing / utility)
 * - Mensajes de servicio (service) de texto libre
 * - Mensajes con imagen opcional
 *
 * @param {Object} params
 * @param {string} params.to - Número destino en formato E.164 (+57...)
 * @param {string} params.body - Texto principal del mensaje
 * @param {string} [params.imageUrl] - URL pública de la imagen a enviar
 * @param {string} [params.useCase] - Uno de los valores de UseCase
 * @param {string} [params.templateName] - Nombre de plantilla aprobada (para marketing/utility/authentication)
 * @param {Object} [params.templateVariables] - Variables para la plantilla
 */
async function sendWhatsAppMessageYCloud({
  to,
  body,
  imageUrl,
  useCase,
  templateName,
  templateVariables,
}) {
  const category = resolveCategoryForUseCase(useCase || UseCase.SEGUIMIENTO_DENTRO_24H);

  ensureConfigured();

  const payload = {
    business_id: YCLOUD_WHATSAPP_BUSINESS_ID,
    to,
    category,
  };

  if (category === MessageCategory.SERVICE) {
    payload.type = imageUrl ? 'image' : 'text';
    if (imageUrl) {
      payload.image = {
        link: imageUrl,
        caption: body,
      };
    } else {
      payload.text = { body };
    }
  } else {
    // Mensajes basados en plantillas
    payload.type = 'template';
    payload.template = {
      name: templateName,
      language: { code: 'es' },
      components: buildTemplateComponentsFromVariables(templateVariables),
    };
  }

  // Llamada real a la API de YCloud
  const endpoint =
    YCLOUD_API_BASE_URL.endsWith('/')
      ? `${YCLOUD_API_BASE_URL}v1/whatsapp/messages`
      : `${YCLOUD_API_BASE_URL}/v1/whatsapp/messages`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${YCLOUD_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ Error al enviar WhatsApp vía YCloud:', errorBody);
    throw new Error(`Error YCloud: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();

  console.log('✅ WhatsApp enviado vía YCloud:', JSON.stringify(data, null, 2));

  return data;
}

/**
 * Construye los componentes de una plantilla a partir de variables simples.
 *
 * Este helper te permite pasar algo como:
 *  { header: ['Empresa X'], body: ['Juan', 'Sesión de Automatización'] }
 * y luego adaptarlo al formato exacto que pida YCloud.
 */
function buildTemplateComponentsFromVariables(templateVariables = {}) {
  const components = [];

  if (templateVariables.header) {
    components.push({
      type: 'header',
      parameters: templateVariables.header.map((value) => ({ type: 'text', text: String(value) })),
    });
  }

  if (templateVariables.body) {
    components.push({
      type: 'body',
      parameters: templateVariables.body.map((value) => ({ type: 'text', text: String(value) })),
    });
  }

  return components;
}

module.exports = {
  MessageCategory,
  UseCase,
  resolveCategoryForUseCase,
  sendWhatsAppMessageYCloud,
};


