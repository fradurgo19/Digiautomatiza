import { Contacto, EnvioMasivoCorreo } from '../types';

/**
 * Servicio para envío de correos electrónicos
 * Conecta con el servidor de email (server/emailServer.js)
 * Usa Outlook: digiautomatiza@outlook.com
 */

// URL del servidor de email
// En Vercel, las funciones serverless usan /api
const EMAIL_SERVER_URL = import.meta.env.MODE === 'production' 
  ? '' // En producción usa la misma URL (rutas /api/...)
  : 'http://localhost:3001'; // En desarrollo usa el servidor local

interface ResultadoEnvioCorreo {
  exitosos: string[];
  fallidos: Array<{ email: string; error: string }>;
}

/**
 * Envía el formulario de contacto por email
 */
export async function enviarFormularioContacto(contacto: Contacto): Promise<void> {
  try {
    console.log('📧 Enviando formulario de contacto...', contacto);
    
    const response = await fetch(`${EMAIL_SERVER_URL}/api/email/contacto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contacto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al enviar el formulario');
    }

    const result = await response.json();
    console.log('✅ Formulario enviado exitosamente:', result);
  } catch (error) {
    console.error('❌ Error en enviarFormularioContacto:', error);
    
    // Si el servidor no está disponible, mostrar mensaje específico
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor de email. Asegúrate de que esté ejecutándose (npm run email:server)');
    }
    
    throw error;
  }
}

/**
 * Envía correos de forma masiva con archivos adjuntos
 */
export async function enviarCorreoMasivo(datos: EnvioMasivoCorreo): Promise<ResultadoEnvioCorreo> {
  try {
    console.log('📧 Enviando correos masivos:', {
      destinatarios: datos.destinatarios.length,
      asunto: datos.asunto,
      archivos: datos.archivosAdjuntos?.length || 0
    });
    
    const formData = new FormData();
    formData.append('destinatarios', JSON.stringify(datos.destinatarios));
    formData.append('asunto', datos.asunto);
    formData.append('mensaje', datos.mensaje);
    
    // Agregar archivos adjuntos si existen
    if (datos.archivosAdjuntos && datos.archivosAdjuntos.length > 0) {
      datos.archivosAdjuntos.forEach((archivo) => {
        formData.append('archivos', archivo);
      });
    }

    const response = await fetch(`${EMAIL_SERVER_URL}/api/email/envio-masivo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al enviar correos masivos');
    }

    const result = await response.json();
    console.log('✅ Correos masivos enviados:', result);
    
    return {
      exitosos: result.resultados.exitosos,
      fallidos: result.resultados.fallidos
    };
  } catch (error) {
    console.error('❌ Error en enviarCorreoMasivo:', error);
    
    // Si el servidor no está disponible
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor de email. Asegúrate de que esté ejecutándose (npm run email:server)');
    }
    
    throw error;
  }
}

