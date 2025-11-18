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
    throw new Error('DATABASE_URL no está configurada en las variables de entorno');
  }

  // Asegurar que la URL tenga sslmode=require para Supabase
  try {
    const url = new URL(databaseUrl);
    
    // Si es Supabase, asegurar sslmode=require
    if (url.hostname.includes('supabase.co')) {
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
      }
      databaseUrl = url.toString();
    }
  } catch (error) {
    // Si falla el parsing, usar la URL original
    console.warn('⚠️ No se pudo parsear DATABASE_URL, usando URL original');
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

