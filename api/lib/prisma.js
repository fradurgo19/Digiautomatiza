/**
 * Cliente de Prisma para funciones serverless de Vercel
 * Solución robusta para evitar conflictos con prepared statements en Supabase
 * 
 * Estrategia:
 * 1. Singleton robusto que persiste entre invocaciones
 * 2. Parámetros de conexión optimizados para serverless
 * 3. Manejo de errores mejorado
 */

import { PrismaClient } from '@prisma/client';

// Singleton a nivel de módulo (persiste en el mismo contenedor)
let prismaInstance = null;

function getPrismaClient() {
  // Si ya existe una instancia en memoria, reutilizarla
  if (prismaInstance) {
    return prismaInstance;
  }

  // Intentar usar globalThis (para desarrollo y hot-reload)
  const globalForPrisma = globalThis;
  
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    return prismaInstance;
  }

  // Obtener DATABASE_URL de las variables de entorno
  let databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    const error = new Error('DATABASE_URL no está configurada en las variables de entorno');
    console.error('❌ Error crítico:', error.message);
    throw error;
  }

  console.log('🔌 Inicializando Prisma Client...');
  console.log('📍 Database host:', databaseUrl.includes('supabase.co') ? 'Supabase' : 'Otro');

  // Asegurar que la URL tenga sslmode=require para Supabase
  // Usar método más robusto que funcione en todos los entornos
  if (databaseUrl.includes('supabase.co') && !databaseUrl.includes('sslmode=')) {
    // Agregar sslmode=require si no está presente
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl = `${databaseUrl}${separator}sslmode=require`;
  }

  // Crear nueva instancia con configuración optimizada para serverless
  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Guardar en globalThis para reutilización (tanto en dev como en prod)
  globalForPrisma.prisma = prismaInstance;

  return prismaInstance;
}

export const prisma = getPrismaClient();
export default prisma;

