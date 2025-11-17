// Script de seed para crear usuarios base en la tabla `usuarios`
// Ejecutar con:
//   node prisma/seedUsuarios.js
//
// IMPORTANTE: asegúrate de tener DATABASE_URL apuntando a la base de datos correcta.

/* eslint-disable no-console */

// Cargar variables de entorno desde .env
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de usuarios comerciales...');

  const usuarios = [
    {
      id: 'admin-001',
      nombre: 'Admin Digiautomatiza',
      email: 'admin@digiautomatiza.com',
      password: 'Admin2025*', // TODO: reemplazar por hash en producción
      rol: 'admin',
      activo: true,
    },
    {
      id: 'luz-comercial-001',
      nombre: 'Luz Comercial',
      email: 'luz.comercial@digiautomatiza.com',
      password: 'Luz2025*', // TODO: reemplazar por hash en producción
      rol: 'comercial',
      activo: true,
    },
    {
      id: 'erika-comercial-001',
      nombre: 'Erika Comercial',
      email: 'erika.comercial@digiautomatiza.com',
      password: 'Erika2025*', // TODO: reemplazar por hash en producción
      rol: 'comercial',
      activo: true,
    },
  ];

  for (const usuario of usuarios) {
    const existente = await prisma.usuario.findUnique({
      where: { email: usuario.email },
    });

    if (existente) {
      console.log(`ℹ️ Usuario ya existe: ${usuario.email} (id: ${existente.id})`);
    } else {
      const creado = await prisma.usuario.create({ data: usuario });
      console.log(`✅ Usuario creado: ${creado.email} (id: ${creado.id})`);
    }
  }

  console.log('🌱 Seed de usuarios completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seedUsuarios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


