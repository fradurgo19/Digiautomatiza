// Vercel Serverless Function - Gestión de Oportunidades (Pipeline)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const { etapa, clienteId } = req.query;
      const usuarioId = req.headers['x-usuario-id'] ?? null;
      const where = {};

      if (etapa && etapa !== 'todas') {
        where.etapa = etapa;
      }
      if (clienteId) {
        where.clienteId = clienteId;
      }
      if (usuarioId) {
        where.usuarioId = String(usuarioId);
      }

      const oportunidades = await prisma.oportunidad.findMany({
        where,
        include: {
          cliente: true,
        },
        orderBy: { createdAt: 'desc' },
      });

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
  } finally {
    await prisma.$disconnect();
  }
}


