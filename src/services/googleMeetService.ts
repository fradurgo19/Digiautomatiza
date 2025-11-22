/**
 * Servicio para generar enlaces de Google Meet
 * Genera enlaces de Google Meet directamente sin necesidad de autenticación
 */

/**
 * Genera un enlace de Google Meet único
 * Google Meet permite crear enlaces directamente usando códigos aleatorios
 */
export function generarEnlaceGoogleMeet(): string {
  // Generar un código aleatorio de 10-11 caracteres (formato estándar de Google Meet)
  const caracteres = 'abcdefghijklmnopqrstuvwxyz';
  const codigo = Array.from({ length: 10 }, () => 
    caracteres[Math.floor(Math.random() * caracteres.length)]
  ).join('');
  
  return `https://meet.google.com/${codigo}`;
}

/**
 * Valida si una URL es un enlace válido de Google Meet
 */
export function esEnlaceGoogleMeetValido(url: string): boolean {
  const patron = /^https?:\/\/(www\.)?meet\.google\.com\/[a-z-]+$/i;
  return patron.test(url);
}

/**
 * Genera un enlace de Google Meet y lo formatea para mostrar
 */
export function generarYFormatearEnlace(): {
  url: string;
  codigo: string;
} {
  const url = generarEnlaceGoogleMeet();
  const codigo = url.split('/').pop() || '';
  
  return { url, codigo };
}

