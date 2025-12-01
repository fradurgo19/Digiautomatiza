/**
 * Servicio de Pagos - Capa de Abstracción
 * 
 * Este servicio utiliza el patrón Adapter para permitir cambiar
 * fácilmente entre diferentes pasarelas de pago (PayU, Wompi, Mercado Pago, etc.)
 * 
 * Para cambiar de pasarela, solo necesitas:
 * 1. Crear un nuevo adapter (ej: WompiAdapter)
 * 2. Cambiar PAYMENT_PROVIDER en las variables de entorno
 * 3. El resto del código sigue funcionando sin cambios
 */

import { DatosPago, RespuestaCrearPago, Transaccion, PasarelaPago, EstadoTransaccion } from '../types';

// URL del backend
const API_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://www.digiautomatiza.co'
    : 'http://localhost:3000');

/**
 * Crear un nuevo pago (público, no requiere autenticación)
 */
export async function crearPago(
  datos: DatosPago & {
    compradorNombre: string;
    compradorEmail: string;
    compradorTelefono?: string;
    compradorDocumento?: string;
  }
): Promise<RespuestaCrearPago> {
  try {
    console.log('💳 Creando pago:', datos);

    const response = await fetch(`${API_URL}/api/pagos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al crear el pago');
    }

    const result = await response.json();
    console.log('✅ Pago creado exitosamente:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error en crearPago:', error);
    throw error;
  }
}

/**
 * Consultar el estado de una transacción
 */
export async function consultarTransaccion(referencia: string): Promise<Transaccion> {
  try {
    const response = await fetch(`${API_URL}/api/pagos?referencia=${referencia}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al consultar la transacción');
    }

    const result = await response.json();
    return result.transaccion;
  } catch (error) {
    console.error('❌ Error en consultarTransaccion:', error);
    throw error;
  }
}

/**
 * Obtener historial de transacciones por email del comprador
 */
export async function obtenerHistorialTransacciones(emailComprador: string): Promise<Transaccion[]> {
  try {
    if (!emailComprador) {
      throw new Error('Email del comprador es requerido');
    }

    const response = await fetch(`${API_URL}/api/pagos?email=${encodeURIComponent(emailComprador)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al obtener el historial');
    }

    const result = await response.json();
    return result.transacciones || [];
  } catch (error) {
    console.error('❌ Error en obtenerHistorialTransacciones:', error);
    throw error;
  }
}

