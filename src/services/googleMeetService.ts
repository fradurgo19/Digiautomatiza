/**
 * Servicio para generar enlaces de Google Meet
 * Genera enlaces de Google Meet directamente sin necesidad de autenticación
 */

/**
 * Genera un enlace de Google Meet único
 * Google Meet requiere un formato específico: xxx-yyyy-zzz (3-4-3 caracteres con guiones)
 */
export function generarEnlaceGoogleMeet(): string {
  // Generar un código en el formato correcto de Google Meet: xxx-yyyy-zzz
  const caracteres = 'abcdefghijklmnopqrstuvwxyz';
  
  // Generar 3 letras
  const parte1 = Array.from({ length: 3 }, () => 
    caracteres[Math.floor(Math.random() * caracteres.length)]
  ).join('');
  
  // Generar 4 letras
  const parte2 = Array.from({ length: 4 }, () => 
    caracteres[Math.floor(Math.random() * caracteres.length)]
  ).join('');
  
  // Generar 3 letras
  const parte3 = Array.from({ length: 3 }, () => 
    caracteres[Math.floor(Math.random() * caracteres.length)]
  ).join('');
  
  // Formato: xxx-yyyy-zzz
  const codigo = `${parte1}-${parte2}-${parte3}`;
  
  return `https://meet.google.com/${codigo}`;
}

/**
 * Valida si una URL es un enlace válido de Google Meet
 * Formato esperado: https://meet.google.com/xxx-yyyy-zzz
 */
export function esEnlaceGoogleMeetValido(url: string): boolean {
  // Validar formato: https://meet.google.com/xxx-yyyy-zzz (3-4-3 caracteres con guiones)
  const patron = /^https?:\/\/(www\.)?meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
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

