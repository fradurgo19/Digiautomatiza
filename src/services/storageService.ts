import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️ Supabase no configurado. Variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY requeridas.');
}

export interface UploadResult {
  url: string;
  nombre: string;
  tipo: 'imagen' | 'documento';
  tamaño: number;
}

/**
 * Sube un archivo a Supabase Storage en el bucket 'propuestas'
 */
export async function subirArchivoPropuesta(
  file: File
): Promise<UploadResult> {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Verifica las variables de entorno.');
  }

  // Permitir cualquier tipo de archivo
  // La validación de tipo se ha removido para permitir todos los archivos

  // Validar tamaño (máximo 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new Error('El archivo es demasiado grande. Máximo 50MB');
  }

  // Generar nombre único para el archivo
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop();
  const fileName = `${timestamp}-${randomStr}.${extension}`;
  const filePath = `propuestas/${fileName}`;

  // Subir archivo
  const { data, error } = await supabase.storage
    .from('propuestas')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) {
    console.error('Error al subir archivo:', error);
    throw new Error(`Error al subir el archivo: ${error.message}`);
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('propuestas')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    nombre: file.name,
    tipo: file.type.startsWith('image/') ? 'imagen' : 'documento',
    tamaño: file.size
  };
}

/**
 * Elimina un archivo de Supabase Storage
 */
export async function eliminarArchivoPropuesta(filePath: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  // Extraer el path del archivo desde la URL completa
  const pathMatch = filePath.match(/propuestas\/(.+)$/);
  if (!pathMatch) {
    throw new Error('URL de archivo inválida');
  }

  const { error } = await supabase.storage
    .from('propuestas')
    .remove([pathMatch[0]]);

  if (error) {
    console.error('Error al eliminar archivo:', error);
    throw new Error(`Error al eliminar el archivo: ${error.message}`);
  }
}

