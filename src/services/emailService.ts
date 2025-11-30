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
    
    // En producción (Vercel), enviar como JSON
    // En desarrollo, usar FormData si hay archivos
    const isProduction = import.meta.env.MODE === 'production' || !EMAIL_SERVER_URL.includes('localhost');
    const hasArchivos = datos.archivosAdjuntos && datos.archivosAdjuntos.length > 0;
    
    let body: FormData | string;
    let headers: HeadersInit = {};
    
    if (isProduction || !hasArchivos) {
      // En producción o sin archivos: enviar como JSON
      body = JSON.stringify({
        destinatarios: datos.destinatarios,
        asunto: datos.asunto,
        mensaje: datos.mensaje,
        // Nota: Los archivos no se envían en JSON, se omiten por ahora
        // TODO: Implementar subida a Supabase Storage y enviar URLs
      });
      headers['Content-Type'] = 'application/json';
    } else {
      // En desarrollo con archivos: usar FormData
      const formData = new FormData();
      formData.append('destinatarios', JSON.stringify(datos.destinatarios));
      formData.append('asunto', datos.asunto);
      formData.append('mensaje', datos.mensaje);
      
      if (datos.archivosAdjuntos && datos.archivosAdjuntos.length > 0) {
        datos.archivosAdjuntos.forEach((archivo) => {
          formData.append('archivos', archivo);
        });
      }
      
      body = formData;
      // No establecer Content-Type para FormData, el navegador lo hace automáticamente
    }

    const response = await fetch(`${EMAIL_SERVER_URL}/api/email/envio-masivo`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      let errorMessage = 'Error al enviar correos masivos';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        // Si no se puede parsear el error, usar el status text
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Correos masivos enviados:', result);
    
    return {
      exitosos: result.resultados?.exitosos || result.exitosos || [],
      fallidos: result.resultados?.fallidos || result.fallidos || []
    };
  } catch (error) {
    console.error('❌ Error en enviarCorreoMasivo:', error);
    
    // Si el servidor no está disponible
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor de email. Verifica tu conexión a internet.');
    }
    
    throw error;
  }
}

