/**
 * Servidor API para Digiautomatiza
 * Maneja operaciones de base de datos con Prisma y Neon PostgreSQL
 */

// Cargar variables de entorno desde .env
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

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

// ===========================================================================
// CLIENTES
// ===========================================================================

// Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
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
    const sesiones = await prisma.sesion.findMany({
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

