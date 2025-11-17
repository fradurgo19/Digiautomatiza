/**
 * Servidor API para Digiautomatiza
 * Maneja operaciones de base de datos con Prisma y Neon PostgreSQL
 */

// Cargar variables de entorno desde .env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { sendWhatsAppMessageYCloud } = require('./whatsappProviderYCloud');

// Importar PrismaClient desde la raíz del proyecto
const { PrismaClient } = require(path.join(__dirname, '..', 'node_modules', '@prisma/client'));

const app = express();
const PORT = 3000;

// Inicializar Prisma
const prisma = new PrismaClient();
const databaseProviderLabel = process.env.DATABASE_URL?.includes('localhost')
  ? 'PostgreSQL Local'
  : 'Neon PostgreSQL';

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para manejar formularios multipart (WhatsApp masivo, etc.)
const upload = multer();

// ===========================================================================
// CLIENTES
// ===========================================================================

// Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const usuarioId = req.headers['x-usuario-id'] ?? null;
    const rol = req.headers['x-usuario-rol'] ?? null;

    const where = {};
    if (usuarioId && String(rol).toLowerCase() !== 'admin') {
      where.usuarioId = String(usuarioId);
    }

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    // Convertir fechas a formato ISO string
    const clientesFormateados = clientes.map(cliente => ({
      ...cliente,
      fechaRegistro: cliente.fechaRegistro.toISOString(),
    }));
    
    res.json({ clientes: clientesFormateados });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// Crear un nuevo cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const usuarioId = req.headers['x-usuario-id'] ?? null;
    const { nombre, email, telefono, empresa, serviciosInteres, estado, notas } = req.body;
    
    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        email,
        telefono,
        empresa,
        serviciosInteres,
        estado: estado || 'nuevo',
        notas,
        usuarioId: usuarioId ? String(usuarioId) : null,
      },
    });
    
    res.json({ 
      cliente: {
        ...cliente,
        fechaRegistro: cliente.fechaRegistro.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// Actualizar un cliente
app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;
    
    const cliente = await prisma.cliente.update({
      where: { id },
      data: datos,
    });
    
    res.json({ 
      cliente: {
        ...cliente,
        fechaRegistro: cliente.fechaRegistro.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// Eliminar un cliente
app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.cliente.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

// ===========================================================================
// SESIONES
// ===========================================================================

// Obtener todas las sesiones con información del cliente
app.get('/api/sesiones', async (req, res) => {
  try {
    const usuarioId = req.headers['x-usuario-id'] ?? null;
    const rol = req.headers['x-usuario-rol'] ?? null;

    const whereSesion = {};
    if (usuarioId && String(rol).toLowerCase() !== 'admin') {
      whereSesion.usuarioId = String(usuarioId);
    }

    const sesiones = await prisma.sesion.findMany({
      where: whereSesion,
      include: {
        cliente: true,
      },
      orderBy: { fecha: 'desc' },
    });
    
    const sesionesFormateadas = sesiones.map(sesion => ({
      ...sesion,
      fecha: sesion.fecha.toISOString(),
      cliente: {
        ...sesion.cliente,
        fechaRegistro: sesion.cliente.fechaRegistro.toISOString(),
      },
    }));
    
    res.json({ sesiones: sesionesFormateadas });
  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

// Crear una nueva sesión
app.post('/api/sesiones', async (req, res) => {
  try {
    const usuarioId = req.headers['x-usuario-id'] ?? null;
    const { clienteId, fecha, hora, servicio, estado, notas, urlReunion } = req.body;
    
    const sesion = await prisma.sesion.create({
      data: {
        clienteId,
        fecha: new Date(fecha),
        hora,
        servicio,
        estado: estado || 'programada',
        notas,
        urlReunion,
        usuarioId: usuarioId ? String(usuarioId) : null,
      },
      include: {
        cliente: true,
      },
    });
    
    res.json({ 
      sesion: {
        ...sesion,
        fecha: sesion.fecha.toISOString(),
        cliente: {
          ...sesion.cliente,
          fechaRegistro: sesion.cliente.fechaRegistro.toISOString(),
        },
      }
    });
  } catch (error) {
    console.error('Error al crear sesión:', error);
    res.status(500).json({ error: 'Error al crear sesión' });
  }
});

// Actualizar una sesión
app.put('/api/sesiones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;
    
    // Si viene fecha, convertirla a Date
    if (datos.fecha) {
      datos.fecha = new Date(datos.fecha);
    }
    
    const sesion = await prisma.sesion.update({
      where: { id },
      data: datos,
      include: {
        cliente: true,
      },
    });
    
    res.json({ 
      sesion: {
        ...sesion,
        fecha: sesion.fecha.toISOString(),
        cliente: {
          ...sesion.cliente,
          fechaRegistro: sesion.cliente.fechaRegistro.toISOString(),
        },
      }
    });
  } catch (error) {
    console.error('Error al actualizar sesión:', error);
    res.status(500).json({ error: 'Error al actualizar sesión' });
  }
});

// Eliminar una sesión
app.delete('/api/sesiones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.sesion.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar sesión:', error);
    res.status(500).json({ error: 'Error al eliminar sesión' });
  }
});

// ===========================================================================
// OPORTUNIDADES COMERCIALES (Pipeline)
// ===========================================================================

// Obtener todas las oportunidades (con cliente)
app.get('/api/oportunidades', async (req, res) => {
  try {
    const { etapa, clienteId } = req.query;
    const usuarioId = req.headers['x-usuario-id'] ?? null;
    const rol = req.headers['x-usuario-rol'] ?? null;

    const where = {};
    if (etapa && etapa !== 'todas') {
      where.etapa = etapa;
    }
    if (clienteId) {
      where.clienteId = clienteId;
    }
    if (usuarioId && String(rol).toLowerCase() !== 'admin') {
      where.usuarioId = String(usuarioId);
    }

    const oportunidades = await prisma.oportunidad.findMany({
      where,
      include: {
        cliente: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      oportunidades: oportunidades.map((opp) => ({
        ...opp,
        cliente: {
          ...opp.cliente,
          fechaRegistro: opp.cliente.fechaRegistro.toISOString(),
        },
      })),
    });
  } catch (error) {
    console.error('Error al obtener oportunidades:', error);
    res.status(500).json({ error: 'Error al obtener oportunidades' });
  }
});

// Crear una nueva oportunidad
app.post('/api/oportunidades', async (req, res) => {
  try {
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

    res.json({
      oportunidad: {
        ...oportunidad,
        cliente: {
          ...oportunidad.cliente,
          fechaRegistro: oportunidad.cliente.fechaRegistro.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error al crear oportunidad:', error);
    res.status(500).json({ error: 'Error al crear oportunidad' });
  }
});

// Actualizar una oportunidad
app.put('/api/oportunidades/:id', async (req, res) => {
  try {
    const { id } = req.params;
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

    res.json({
      oportunidad: {
        ...oportunidad,
        cliente: {
          ...oportunidad.cliente,
          fechaRegistro: oportunidad.cliente.fechaRegistro.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error al actualizar oportunidad:', error);
    res.status(500).json({ error: 'Error al actualizar oportunidad' });
  }
});

// Eliminar una oportunidad
app.delete('/api/oportunidades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.oportunidad.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar oportunidad:', error);
    res.status(500).json({ error: 'Error al eliminar oportunidad' });
  }
});

// ===========================================================================
// CONTACTOS (Formulario público)
// ===========================================================================

// Guardar contacto
app.post('/api/contactos', async (req, res) => {
  try {
    const { nombre, email, telefono, empresa, servicio, mensaje } = req.body;
    
    const contacto = await prisma.contacto.create({
      data: {
        nombre,
        email,
        telefono,
        empresa,
        servicio,
        mensaje,
      },
    });
    
    res.json({ contacto });
  } catch (error) {
    console.error('Error al guardar contacto:', error);
    res.status(500).json({ error: 'Error al guardar contacto' });
  }
});

// Obtener contactos
app.get('/api/contactos', async (req, res) => {
  try {
    const contactos = await prisma.contacto.findMany({
      orderBy: { fechaEnvio: 'desc' },
    });
    
    res.json({ contactos });
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    res.status(500).json({ error: 'Error al obtener contactos' });
  }
});

// ===========================================================================
// WHATSAPP - Envío masivo vía YCloud
// ===========================================================================

/**
 * Endpoint para enviar mensajes de WhatsApp de forma masiva usando YCloud.
 * Espera un formulario (multipart o JSON) con:
 * - numeros: JSON.stringify([...numerosEnFormatoE164])
 * - mensaje: texto del mensaje
 */
app.post('/api/whatsapp/enviar-masivo', upload.any(), async (req, res) => {
  try {
    const numerosRaw = req.body.numeros;
    const mensaje = req.body.mensaje;

    if (!numerosRaw || !mensaje) {
      return res.status(400).json({ error: 'Faltan parámetros: numeros y mensaje son obligatorios' });
    }

    let numeros = [];
    try {
      numeros = Array.isArray(numerosRaw) ? numerosRaw : JSON.parse(numerosRaw);
    } catch (e) {
      return res.status(400).json({ error: 'El campo "numeros" debe ser un JSON válido' });
    }

    if (!Array.isArray(numeros) || numeros.length === 0) {
      return res.status(400).json({ error: 'Debes enviar al menos un número de destino' });
    }

    const exitosos = [];
    const fallidos = [];

    for (const numero of numeros) {
      try {
        await sendWhatsAppMessageYCloud({
          to: numero,
          body: mensaje,
        });
        exitosos.push(numero);
      } catch (error) {
        console.error(`Error al enviar WhatsApp a ${numero}:`, error);
        fallidos.push({
          numero,
          error: error.message || 'Error desconocido al enviar mensaje',
        });
      }
    }

    res.json({ exitosos, fallidos });
  } catch (error) {
    console.error('Error en /api/whatsapp/enviar-masivo:', error);
    res.status(500).json({ error: 'Error al procesar envío masivo de WhatsApp' });
  }
});

// ===========================================================================
// HEALTH CHECK
// ===========================================================================

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API Digiautomatiza funcionando',
    database: databaseProviderLabel,
    version: '1.0.0'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// ===========================================================================
// STATS COMERCIALES (Dashboard)
// ===========================================================================

app.get('/api/stats', async (req, res) => {
  try {
    const usuarioId = req.headers['x-usuario-id'] ?? null;
    const rol = req.headers['x-usuario-rol'] ?? null;

    const isAdmin = String(rol).toLowerCase() === 'admin';

    const whereCliente = {};
    const whereSesion = {};

    if (usuarioId && !isAdmin) {
      whereCliente.usuarioId = String(usuarioId);
      whereSesion.usuarioId = String(usuarioId);
    }

    const [totalClientes, clientesInteresados, sesionesProgramadas, sesionesCompletadas] =
      await Promise.all([
        prisma.cliente.count({ where: whereCliente }),
        prisma.cliente.count({
          where: {
            ...whereCliente,
            estado: { in: ['interesado', 'en-negociacion', 'convertido'] },
          },
        }),
        prisma.sesion.count({
          where: {
            ...whereSesion,
            estado: { in: ['programada', 'confirmada', 'reprogramada'] },
          },
        }),
        prisma.sesion.count({
          where: {
            ...whereSesion,
            estado: 'completada',
          },
        }),
      ]);

    res.json({
      totalClientes,
      clientesInteresados,
      sesionesProgramadas,
      sesionesCompletadas,
      scope: isAdmin ? 'global' : 'usuario',
    });
  } catch (error) {
    console.error('Error en /api/stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ===========================================================================
// LOGIN (autenticación básica para usuarios comerciales)
// ===========================================================================

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario || usuario.password !== password || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({
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
    res.status(500).json({ error: 'Error en login' });
  }
});

// ===========================================================================
// INICIAR SERVIDOR
// ===========================================================================

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   API Digiautomatiza`);
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Base de Datos: ${databaseProviderLabel}`);
  console.log('========================================\n');
});

// Cerrar Prisma al terminar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

