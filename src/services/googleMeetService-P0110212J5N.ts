/**
 * Servicio para validar enlaces de Google Meet
 * NOTA: No se pueden generar enlaces válidos de Google Meet sin crear una reunión real
 * Los enlaces válidos solo se pueden obtener:
 * 1. Creando un evento en Google Calendar con Google Meet habilitado
 * 2. Creando una reunión manualmente en meet.google.com
 */

/**
 * Valida si una URL es un enlace válido de Google Meet
 * Formato esperado: https://meet.google.com/xxx-yyyy-zzz
 */
export function esEnlaceGoogleMeetValido(url: string): boolean {
  // Validar formato: https://meet.google.com/xxx-yyyy-zzz (3-4-3 caracteres con guiones)
  const patron = /^https?:\/\/(www\.)?meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
  return patron.test(url);
}


