/**
 * Cliente de Prisma para funciones serverless de Vercel
 * Usa patrón singleton para evitar conflictos con prepared statements
 * 
 * IMPORTANTE: Para Supabase en Vercel, usa el puerto de pooling (6543)
 * en lugar del directo (5432) para evitar errores de prepared statements
 */

import { PrismaClient } from '@prisma/client';

// Usar una variable de módulo para el singleton (persiste entre invocaciones en el mismo contenedor)
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

  // Ajustar DATABASE_URL para usar pooling si es necesario
  let databaseUrl = process.env.DATABASE_URL;
  
  // Si es Supabase y usa puerto 5432, cambiar a 6543 (pooling)
  if (databaseUrl && databaseUrl.includes('supabase.co') && databaseUrl.includes(':5432')) {
    databaseUrl = databaseUrl.replace(':5432', ':6543');
    console.log('⚠️ Usando puerto de pooling (6543) para Supabase en serverless');
  }

  // Crear nueva instancia
  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Guardar en globalThis para desarrollo y reutilización
  globalForPrisma.prisma = prismaInstance;

  return prismaInstance;
}

export const prisma = getPrismaClient();
export default prisma;

