import { EnvioMasivoWhatsApp } from '../types';

/**
 * Servicio para envío de mensajes de WhatsApp
 * Soporta múltiples métodos de envío:
 * 1. Twilio WhatsApp API (Producción)
 * 2. Meta Cloud API (Producción)
 * 3. Backend personalizado (YCloud) - Configurado por defecto
 */

// Tipo de configuración
type WhatsAppProvider = 'twilio' | 'meta' | 'backend' | 'demo';

// Configuración del proveedor (cambiar según necesidad)
// Para usar YCloud, el flujo recomendado es vía backend personalizado.
// Puedes cambiar a 'backend' cuando tengas el backend configurado en producción.
const WHATSAPP_PROVIDER: WhatsAppProvider = 'backend';

// Variables de entorno (configurar en .env)
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
// URL del backend - En producción siempre usa el dominio de producción
// Si VITE_BACKEND_URL no está configurada, detecta automáticamente el entorno
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.MODE === 'production' || import.meta.env.PROD
    ? 'https://www.digiautomatiza.co' 
    : 'http://localhost:3000');

interface ResultadoEnvio {
  exitosos: string[];
  fallidos: Array<{ numero: string; error: string }>;
}

/**
 * Envía mensajes de WhatsApp de forma masiva usando el proveedor configurado
 */
export async function enviarWhatsAppMasivo(datos: EnvioMasivoWhatsApp): Promise<ResultadoEnvio> {
  console.log(`Enviando mensajes de WhatsApp usando proveedor: ${WHATSAPP_PROVIDER}`);
  
  switch (WHATSAPP_PROVIDER) {
    case 'twilio':
      return await enviarConTwilio(datos);
    case 'meta':
      return await enviarConMeta(datos);
    case 'backend':
      return await enviarConBackend(datos);
    case 'demo':
    default:
      return await enviarDemo(datos);
  }
}

/**
 * Genera un enlace wa.me con el número en formato E.164 y el mensaje codificado
 */
export function generarLinkWaMe(numero: string, mensaje: string): string {
  const numeroFormateado = formatearNumeroWhatsApp(numero).replace('+', '');
  const textoCodificado = encodeURIComponent(mensaje);
  return `https://wa.me/${numeroFormateado}?text=${textoCodificado}`;
}

/**
 * Implementación con Twilio WhatsApp API
 * Documentación: https://www.twilio.com/docs/whatsapp/api
 */
async function enviarConTwilio(datos: EnvioMasivoWhatsApp): Promise<ResultadoEnvio> {
  const exitosos: string[] = [];
  const fallidos: Array<{ numero: string; error: string }> = [];

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Configura VITE_TWILIO_ACCOUNT_SID y VITE_TWILIO_AUTH_TOKEN en tu .env');
  }

  // Codificar credenciales para Basic Auth
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  for (const numero of datos.numeros) {
    try {
      const numeroFormateado = formatearNumeroWhatsApp(numero);
      
      // Preparar el cuerpo del mensaje
      const body = new URLSearchParams({
        From: TWILIO_WHATSAPP_NUMBER,
        To: `whatsapp:${numeroFormateado}`,
        Body: datos.mensaje,
      });

      // Si hay archivos, usar MediaUrl (Twilio soporta hasta 10)
      if (datos.archivos && datos.archivos.length > 0) {
        // En producción, primero debes subir los archivos a un servidor
        // y usar las URLs públicas aquí
        console.warn('Para adjuntar archivos con Twilio, primero súbelos a un servidor y usa MediaUrl');
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      if (response.ok) {
        exitosos.push(numero);
      } else {
        const error = await response.json();
        fallidos.push({ numero, error: error.message || 'Error desconocido' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      fallidos.push({ numero, error: errorMessage });
    }
  }

  return { exitosos, fallidos };
}

/**
 * Implementación con Meta Cloud API (WhatsApp Business API oficial)
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
async function enviarConMeta(datos: EnvioMasivoWhatsApp): Promise<ResultadoEnvio> {
  const exitosos: string[] = [];
  const fallidos: Array<{ numero: string; error: string }> = [];

  const META_ACCESS_TOKEN = import.meta.env.VITE_META_ACCESS_TOKEN || '';
  const META_PHONE_NUMBER_ID = import.meta.env.VITE_META_PHONE_NUMBER_ID || '';

  if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
    throw new Error('Configura VITE_META_ACCESS_TOKEN y VITE_META_PHONE_NUMBER_ID en tu .env');
  }

  for (const numero of datos.numeros) {
    try {
      const numeroFormateado = formatearNumeroWhatsApp(numero).replace('+', '');

      const payload = {
        messaging_product: 'whatsapp',
        to: numeroFormateado,
        type: 'text',
        text: {
          body: datos.mensaje,
        },
      };

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${META_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        exitosos.push(numero);
      } else {
        const error = await response.json();
        fallidos.push({ numero, error: error.error?.message || 'Error desconocido' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      fallidos.push({ numero, error: errorMessage });
    }
  }

  return { exitosos, fallidos };
}

/**
 * Implementación con backend personalizado (YCloud)
 * El backend maneja la integración con YCloud API
 */
async function enviarConBackend(datos: EnvioMasivoWhatsApp): Promise<ResultadoEnvio> {
  try {
    console.log('📤 Enviando mensajes vía backend (YCloud)...');
    
    const response = await fetch(`${BACKEND_API_URL}/api/whatsapp/enviar-masivo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numeros: datos.numeros,
        mensaje: datos.mensaje,
        archivos: datos.archivos, // Incluir archivos si existen
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const resultado = await response.json();
    console.log('✅ Resultado del envío:', resultado);
    return resultado;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al conectar con el backend';
    console.error('❌ Error en envío con backend:', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Modo demo - simula envíos exitosos
 */
async function enviarDemo(datos: EnvioMasivoWhatsApp): Promise<ResultadoEnvio> {
  console.log('=== MODO DEMO - WhatsApp ===');
  console.log('Números destinatarios:', datos.numeros);
  console.log('Mensaje:', datos.mensaje);
  console.log('Archivos:', datos.archivos?.length || 0);
  
  // Simular delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simular algunos éxitos y algunos fallos para testing
  const exitosos = datos.numeros.slice(0, Math.ceil(datos.numeros.length * 0.8));
  const fallidos = datos.numeros.slice(Math.ceil(datos.numeros.length * 0.8)).map(numero => ({
    numero,
    error: 'Número inválido (simulado en modo demo)',
  }));

  console.log('Exitosos:', exitosos.length);
  console.log('Fallidos:', fallidos.length);

  return { exitosos, fallidos };
}

/**
 * Formatea el número de teléfono al formato internacional
 */
export function formatearNumeroWhatsApp(numero: string): string {
  // Remover espacios y caracteres especiales
  let numeroLimpio = numero.replace(/[\s()-]/g, '');
  
  // Si no tiene +, agregarlo
  if (!numeroLimpio.startsWith('+')) {
    numeroLimpio = '+' + numeroLimpio;
  }
  
  return numeroLimpio;
}

/**
 * Valida que el número tenga formato internacional correcto
 */
export function validarNumeroWhatsApp(numero: string): boolean {
  const numeroFormateado = formatearNumeroWhatsApp(numero);
  // Formato E.164: + seguido de 1-15 dígitos
  const regex = /^\+[1-9]\d{1,14}$/;
  return regex.test(numeroFormateado);
}

/**
 * Valida múltiples números y retorna los válidos e inválidos
 */
export function validarNumerosWhatsApp(numeros: string[]): {
  validos: string[];
  invalidos: string[];
} {
  const validos: string[] = [];
  const invalidos: string[] = [];

  numeros.forEach(numero => {
    if (validarNumeroWhatsApp(numero)) {
      validos.push(formatearNumeroWhatsApp(numero));
    } else {
      invalidos.push(numero);
    }
  });

  return { validos, invalidos };
}

/**
 * Obtiene información sobre el proveedor configurado
 */
export function obtenerInfoProveedor(): {
  proveedor: WhatsAppProvider;
  configurado: boolean;
  mensaje: string;
} {
  switch (WHATSAPP_PROVIDER) {
    case 'twilio':
      return {
        proveedor: 'twilio',
        configurado: Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN),
        mensaje: 'Twilio WhatsApp API',
      };
    case 'meta':
      return {
        proveedor: 'meta',
        configurado: Boolean(
          import.meta.env.VITE_META_ACCESS_TOKEN && 
          import.meta.env.VITE_META_PHONE_NUMBER_ID
        ),
        mensaje: 'Meta Cloud API (WhatsApp Business)',
      };
    case 'backend':
      return {
        proveedor: 'backend',
        configurado: Boolean(BACKEND_API_URL),
        mensaje: 'Backend personalizado (YCloud)',
      };
    case 'demo':
    default:
      return {
        proveedor: 'demo',
        configurado: true,
        mensaje: 'Modo Demo (solo simulación)',
      };
  }
}

