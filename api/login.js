// Vercel Serverless Function - Login de Usuarios (Proxy a stats.js)
// Este archivo existe solo para mantener la ruta /api/login funcionando
// La lógica real está en stats.js
import prisma from './lib/prisma.js';

function setCORSHeaders(req, res) {
  const allowedOrigins = [
    'https://www.digiautomatiza.co',
    'https://digiautomatiza.co',
    'https://digiautomatiza.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  return allowedOrigin;
}

export default async function handler(req, res) {
  setCORSHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, password } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || usuario.password !== password || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.status(200).json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    });
  } catch (error) {
    console.error('Error en /api/login:', error);
    res.status(500).json({ error: error.message });
  }
}

