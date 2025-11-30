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
    const error = new Error('DATABASE_URL no está configurada en las variables de entorno de Vercel');
    console.error('❌ Error crítico:', error.message);
    console.error('💡 Solución: Ve a Vercel → Settings → Environment Variables y agrega DATABASE_URL');
    throw error;
  }

  // Validar formato básico de la URL
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    const error = new Error(`DATABASE_URL tiene un formato inválido. Debe empezar con 'postgresql://' o 'postgres://'`);
    console.error('❌ Error crítico:', error.message);
    console.error('📋 URL actual (parcial):', databaseUrl.substring(0, 20) + '...');
    throw error;
  }

  console.log('🔌 Inicializando Prisma Client...');
  const isSupabase = databaseUrl.includes('supabase.co');
  
  // Para Supabase en serverless (Vercel), usar Transaction pooler (puerto 6543)
  // Si la URL usa la conexión directa (5432), convertirla al pooler ANTES de cualquier otra cosa
  if (isSupabase) {
    // Detectar si es conexión directa (db.kixlndfaipkgkhxqbdao.supabase.co:5432)
    const isDirectConnection = databaseUrl.includes('db.kixlndfaipkgkhxqbdao.supabase.co:5432');
    
    // Convertir a Transaction pooler (6543) - funciona mejor en serverless
    // Aunque puede tener problemas con prepared statements, es la única opción que funciona desde Vercel
    if (isDirectConnection) {
      console.log('🔄 Detectada conexión directa, convirtiendo a Transaction pooler...');
      
      // Usar Transaction pooler (puerto 6543)
      databaseUrl = databaseUrl.replace(
        'db.kixlndfaipkgkhxqbdao.supabase.co:5432',
        'aws-1-us-east-2.pooler.supabase.com:6543'
      );
      
      // Cambiar usuario de 'postgres' a 'postgres.kixlndfaipkgkhxqbdao' para pooler
      databaseUrl = databaseUrl.replace(
        'postgresql://postgres:',
        'postgresql://postgres.kixlndfaipkgkhxqbdao:'
      );
      
      console.log('✅ Convertida a Transaction pooler (puerto 6543)');
    }
    
    // Asegurar que la URL tenga sslmode=require y pgbouncer=true
    // pgbouncer=true desactiva prepared statements, evitando el error "prepared statement already exists"
    const separator = databaseUrl.includes('?') ? '&' : '?';
    const params = [];
    
    if (!databaseUrl.includes('sslmode=')) {
      params.push('sslmode=require');
    }
    
    // Desactivar prepared statements para evitar conflictos con Supabase pooler
    if (!databaseUrl.includes('pgbouncer=')) {
      params.push('pgbouncer=true');
    }
    
    if (params.length > 0) {
      databaseUrl = `${databaseUrl}${separator}${params.join('&')}`;
      console.log('✅ Parámetros agregados:', params.join(', '));
    }
    
    // Logging después de la conversión
    console.log('📍 Database host: Supabase');
    try {
      const urlMatch = databaseUrl.match(/@([^:]+):(\d+)/);
      if (urlMatch) {
        const host = urlMatch[1];
        const port = urlMatch[2];
        console.log(`📍 Supabase: ${host}:${port}`);
      }
    } catch (e) {
      // Ignorar errores de parsing
    }
  } else {
    console.log('📍 Database host: Otro');
  }

  // Crear nueva instancia con configuración optimizada para serverless
  try {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      // Desactivar prepared statements para Supabase pooler
      // Esto evita el error "prepared statement already exists"
      ...(isSupabase && {
        __internal: {
          engine: {
            connectTimeout: 10000,
          },
        },
      }),
    });

    // Guardar en globalThis para reutilización (tanto en dev como en prod)
    globalForPrisma.prisma = prismaInstance;

    console.log('✅ Prisma Client inicializado correctamente');
    return prismaInstance;
  } catch (error) {
    console.error('❌ Error al crear Prisma Client:', error.message);
    console.error('💡 Verifica que:');
    console.error('   1. DATABASE_URL esté correctamente configurada en Vercel');
    console.error('   2. El proyecto de Supabase esté activo (no pausado)');
    console.error('   3. Las credenciales sean correctas');
    console.error('   4. La URL use el formato: postgresql://usuario:password@host:5432/database?sslmode=require');
    throw error;
  }
}

export const prisma = getPrismaClient();
export default prisma;

