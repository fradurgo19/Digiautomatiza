/**
 * Proveedor de WhatsApp basado en YCloud (diseño listo para integrar su API)
 *
 * Objetivo:
 * - Centralizar TODAS las llamadas a WhatsApp en un solo módulo.
 * - Mapear los casos de uso del negocio (Digiautomatiza) a los tipos de conversación de WhatsApp.
 * - Dejar lista la estructura para conectar la API real de YCloud cuando tengas tu cuenta.
 *
 * NOTA IMPORTANTE:
 * - Este archivo NO realiza llamadas reales hasta que completes las variables de entorno
 *   y el endpoint concreto de YCloud.
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
 * Completa estas variables en tu .env cuando abras la cuenta:
 *
 *  YCLOUD_API_BASE_URL=https://api.ycloud.com   (ejemplo, revisar doc oficial)
 *  YCLOUD_API_KEY=tu_api_key_de_ycloud
 *  YCLOUD_WHATSAPP_BUSINESS_ID=tu_business_id_o_canal
 */
const YCLOUD_API_BASE_URL = process.env.YCLOUD_API_BASE_URL || '';
const YCLOUD_API_KEY = process.env.YCLOUD_API_KEY || '';
const YCLOUD_WHATSAPP_BUSINESS_ID = process.env.YCLOUD_WHATSAPP_BUSINESS_ID || '';

function ensureConfigured() {
  if (!YCLOUD_API_BASE_URL || !YCLOUD_API_KEY || !YCLOUD_WHATSAPP_BUSINESS_ID) {
    throw new Error(
      'YCloud no está configurado. Define YCLOUD_API_BASE_URL, YCLOUD_API_KEY y YCLOUD_WHATSAPP_BUSINESS_ID en .env'
    );
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

  // Por ahora solo dejamos el diseño. Cuando tengas la doc de YCloud:
  // 1. Elige el endpoint correcto (ej. /whatsapp/messages o similar).
  // 2. Ajusta el payload según la categoría y soporte de plantillas.

  ensureConfigured();

  // Ejemplo de payload genérico (NO definitivo, adaptar a especificación de YCloud)
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

  // Cuando conectes la API real, descomenta la llamada fetch
  // y revisa la autenticación (ejemplo con Bearer token):
  /*
  const response = await fetch(`${YCLOUD_API_BASE_URL}/v1/whatsapp/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YCLOUD_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error YCloud: ${response.status} - ${errorBody}`);
  }

  return await response.json();
  */

  // Modo diseño / stub: solo loguea para pruebas sin enviar nada
  console.log('🧪 [whatsappProviderYCloud] Payload listo para enviar a YCloud:');
  console.log(JSON.stringify(payload, null, 2));

  return {
    success: true,
    simulated: true,
  };
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


