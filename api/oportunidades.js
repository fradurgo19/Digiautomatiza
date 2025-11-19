// Vercel Serverless Function - Gestión de Oportunidades (Pipeline)
import prisma from './lib/prisma.js';

export default async function handler(req, res) {
  // Configurar CORS
  // Orígenes permitidos
  const allowedOrigins = [
    'https://www.digiautomatiza.co',
    'https://digiautomatiza.co',
    'https://digiautomatiza.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const { etapa, clienteId } = req.query;
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const rol = req.headers['x-usuario-rol'] ?? null;
      const isAdmin = rol && String(rol).toLowerCase() === 'admin';
      const where = {};

      if (etapa && etapa !== 'todas') {
        where.etapa = etapa;
      }
      if (clienteId) {
        where.clienteId = clienteId;
      }
      // Solo filtrar por usuario si NO es admin
      if (usuarioId && !isAdmin) {
        where.usuarioId = String(usuarioId);
      }

      // Construir filtro de manera explícita (undefined si no hay filtro)
      const whereFilter = Object.keys(where).length > 0 ? where : undefined;

      console.log('📋 Obteniendo oportunidades - Admin:', isAdmin, 'UsuarioId:', usuarioId, 'Filtro:', whereFilter);

      const oportunidades = await prisma.oportunidad.findMany({
        ...(whereFilter && { where: whereFilter }),
        include: {
          cliente: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`✅ Oportunidades obtenidas: ${oportunidades.length}`);

      // Headers para evitar caché
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');

      res.status(200).json({ oportunidades });
    } else if (req.method === 'POST') {
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const {
        clienteId,
        titulo,
        descripcion,
        servicioPrincipal,
        etapa,
        origen,
        valorEstimado,
        probabilidad,
        fechaCierreEstimada,
      } = req.body;

      const oportunidad = await prisma.oportunidad.create({
        data: {
          clienteId,
          titulo,
          descripcion,
          servicioPrincipal,
          etapa: etapa || 'nuevo',
          origen,
          valorEstimado: valorEstimado ?? null,
          probabilidad: probabilidad ?? null,
          fechaCierreEstimada: fechaCierreEstimada ? new Date(fechaCierreEstimada) : null,
          usuarioId: usuarioId ? String(usuarioId) : null,
        },
        include: {
          cliente: true,
        },
      });

      res.status(201).json({ oportunidad });
    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const datos = { ...req.body };

      if (datos.fechaCierreEstimada) {
        datos.fechaCierreEstimada = new Date(datos.fechaCierreEstimada);
      }

      const oportunidad = await prisma.oportunidad.update({
        where: { id },
        data: datos,
        include: {
          cliente: true,
        },
      });

      res.status(200).json({ oportunidad });
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      await prisma.oportunidad.delete({ where: { id } });
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error en /api/oportunidades:', error);
    res.status(500).json({ error: error.message });
  }
}


