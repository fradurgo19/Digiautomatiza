// Vercel Serverless Function - Pagos Unificado (Crear, Consultar, Historial, Webhook)
import prisma from './lib/prisma.mjs';
import { setCORSHeaders } from './lib/cors.mjs';
import crypto from 'crypto';

// Obtener la pasarela configurada (default: payu)
const PAYMENT_PROVIDER = (process.env.PAYMENT_PROVIDER || 'payu').toLowerCase();

/**
 * Generar referencia única para la transacción
 */
function generarReferencia() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `DIGI-${timestamp}-${random}`;
}

/**
 * Crear pago con PayU
 */
async function crearPagoPayU(datos) {
  const {
    valor,
    descripcion,
    compradorEmail,
    compradorNombre,
    compradorTelefono,
    compradorDocumento,
  } = datos;

  // Credenciales de PayU (desde variables de entorno)
  const merchantId = process.env.PAYU_MERCHANT_ID;
  const apiKey = process.env.PAYU_API_KEY;
  const apiLogin = process.env.PAYU_API_LOGIN;
  const accountId = process.env.PAYU_ACCOUNT_ID;
  const isTest = process.env.PAYU_TEST_MODE === 'true';

  // URL base de PayU (Colombia)
  const baseUrl = isTest
    ? 'https://sandbox.api.payulatam.com'
    : 'https://api.payulatam.com';

  // Generar firma para la petición
  const referencia = generarReferencia();
  const valorFormateado = Math.round(valor).toString();
  const moneda = 'COP';
  
  // Crear la firma según la documentación de PayU
  const firma = `${apiKey}~${merchantId}~${referencia}~${valorFormateado}~${moneda}`;
  const signature = crypto.createHash('md5').update(firma).digest('hex');

  // Datos de la petición a PayU
  const payload = {
    language: 'es',
    command: 'SUBMIT_TRANSACTION',
    merchant: {
      apiKey: apiKey,
      apiLogin: apiLogin,
    },
    transaction: {
      order: {
        accountId: accountId,
        referenceCode: referencia,
        description: descripcion,
        language: 'es',
        signature: signature,
        notifyUrl: `${process.env.VERCEL_URL || 'https://www.digiautomatiza.co'}/api/pagos`,
        additionalValues: {
          TX_VALUE: {
            value: valorFormateado,
            currency: moneda,
          },
        },
        buyer: {
          merchantBuyerId: compradorDocumento || '1',
          fullName: compradorNombre,
          emailAddress: compradorEmail,
          contactPhone: compradorTelefono,
          dniNumber: compradorDocumento || '',
        },
      },
    },
    test: isTest,
  };

  try {
    const response = await fetch(`${baseUrl}/payments-api/4.0/service.cgi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.code === 'SUCCESS' && result.transactionResponse) {
      const transactionResponse = result.transactionResponse;
      
      return {
        success: true,
        transactionId: transactionResponse.transactionId,
        referencia: referencia,
        urlPago: transactionResponse.paymentURL || transactionResponse.extraParameters?.URL_PAYMENT_REDIRECT,
        estado: transactionResponse.state === 'PENDING' ? 'pendiente' : 'procesando',
        respuestaCompleta: result,
      };
    } else {
      throw new Error(result.error || 'Error al crear el pago en PayU');
    }
  } catch (error) {
    console.error('Error en PayU:', error);
    throw error;
  }
}

/**
 * Verificar firma de PayU
 */
function verificarFirmaPayU(datos, firmaRecibida) {
  const apiKey = process.env.PAYU_API_KEY;
  const merchantId = process.env.PAYU_MERCHANT_ID;
  
  // Construir la firma esperada
  const referencia = datos.referenceCode || datos.reference_sale;
  const valor = datos.value || datos.value.toString();
  const moneda = datos.currency || 'COP';
  const estado = datos.state || datos.transactionState;
  
  const firmaEsperada = `${apiKey}~${merchantId}~${referencia}~${valor}~${moneda}~${estado}`;
  const signature = crypto.createHash('md5').update(firmaEsperada).digest('hex');
  
  return signature === firmaRecibida;
}

/**
 * Mapear estado de PayU a estado interno
 */
function mapearEstadoPayU(estadoPayU) {
  const estados = {
    'PENDING': 'pendiente',
    'APPROVED': 'aprobada',
    'DECLINED': 'rechazada',
    'EXPIRED': 'cancelada',
    'PENDING_TRANSACTION_CONFIRMATION': 'procesando',
  };
  return estados[estadoPayU] || 'pendiente';
}

export default async function handler(req, res) {
  setCORSHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Obtener parámetros de la petición
  const referencia = req.query?.referencia;

  try {
    // ========== WEBHOOK (POST sin parámetros específicos, viene de PayU) ==========
    if (req.method === 'POST' && !req.body?.valor && (req.body?.referenceCode || req.body?.reference_sale)) {
      // Es un webhook de PayU
      if (PAYMENT_PROVIDER === 'payu') {
        const datos = req.body;
        
        // Verificar firma si está presente
        if (datos.signature) {
          const esValida = verificarFirmaPayU(datos, datos.signature);
          if (!esValida) {
            console.error('⚠️ Firma de webhook inválida');
            return res.status(400).json({ error: 'Firma inválida' });
          }
        }

        // Obtener referencia de la transacción
        const referenciaWebhook = datos.referenceCode || datos.reference_sale;
        if (!referenciaWebhook) {
          return res.status(400).json({ error: 'Referencia no encontrada' });
        }

        // Buscar transacción en la BD
        const transaccion = await prisma.transaccion.findUnique({
          where: { referencia: referenciaWebhook },
        });

        if (!transaccion) {
          console.error(`⚠️ Transacción no encontrada: ${referenciaWebhook}`);
          return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        // Mapear estado
        const estadoPayU = datos.state || datos.transactionState;
        const estadoNuevo = mapearEstadoPayU(estadoPayU);

        // Actualizar transacción
        const datosActualizacion = {
          estado: estadoNuevo,
          respuestaPasarela: JSON.stringify(datos),
          transactionId: datos.transactionId || datos.transaction_id || transaccion.transactionId,
        };

        // Si está aprobada, actualizar fechas
        if (estadoNuevo === 'aprobada') {
          datosActualizacion.fechaPago = new Date();
          datosActualizacion.fechaConfirmacion = new Date();
        }

        await prisma.transaccion.update({
          where: { id: transaccion.id },
          data: datosActualizacion,
        });

        console.log(`✅ Transacción ${referenciaWebhook} actualizada a estado: ${estadoNuevo}`);

        // Responder a PayU (requerido)
        return res.status(200).json({ 
          success: true,
          message: 'Webhook procesado correctamente' 
        });
      } else {
        return res.status(400).json({ 
          error: `Webhook para ${PAYMENT_PROVIDER} no implementado` 
        });
      }
    }

    // ========== CREAR PAGO (POST con valor) ==========
    if (req.method === 'POST' && req.body?.valor) {
      // El pago es público, no requiere autenticación
      // Los datos del comprador vienen en el body
      const { 
        valor, 
        descripcion, 
        metodoPago, 
        datosAdicionales,
        compradorNombre,
        compradorEmail,
        compradorTelefono,
        compradorDocumento
      } = req.body;

      // Validaciones
      if (!valor || valor <= 0) {
        return res.status(400).json({ error: 'El valor debe ser mayor a 0' });
      }

      if (!descripcion) {
        return res.status(400).json({ error: 'La descripción es requerida' });
      }

      // Validar datos del comprador
      if (!compradorEmail || !compradorNombre) {
        return res.status(400).json({ 
          error: 'Email y nombre del comprador son requeridos' 
        });
      }

      // Generar referencia única
      const referenciaNueva = generarReferencia();

      // Crear transacción en la BD (sin usuarioId, es pago público)
      const transaccion = await prisma.transaccion.create({
        data: {
          usuarioId: null, // Pago público, sin usuario asociado
          referencia: referenciaNueva,
          pasarela: PAYMENT_PROVIDER,
          estado: 'pendiente',
          metodoPago: metodoPago || null,
          valor: parseFloat(valor),
          moneda: 'COP',
          descripcion: descripcion,
          datosPago: JSON.stringify({
            compradorNombre,
            compradorEmail,
            compradorTelefono: compradorTelefono || '',
            compradorDocumento: compradorDocumento || '',
            ...datosAdicionales
          }),
        },
      });

      // Crear pago en la pasarela según el proveedor
      let resultadoPasarela;
      
      if (PAYMENT_PROVIDER === 'payu') {
        resultadoPasarela = await crearPagoPayU({
          valor: parseFloat(valor),
          descripcion: descripcion,
          compradorEmail: compradorEmail,
          compradorNombre: compradorNombre,
          compradorTelefono: compradorTelefono || '',
          compradorDocumento: compradorDocumento || '',
        });
      } else {
        return res.status(400).json({ 
          error: `Pasarela ${PAYMENT_PROVIDER} no implementada aún` 
        });
      }

      // Actualizar transacción con datos de la pasarela
      await prisma.transaccion.update({
        where: { id: transaccion.id },
        data: {
          transactionId: resultadoPasarela.transactionId,
          urlPago: resultadoPasarela.urlPago,
          estado: resultadoPasarela.estado,
          respuestaPasarela: JSON.stringify(resultadoPasarela.respuestaCompleta),
        },
      });

      return res.status(200).json({
        success: true,
        transaccionId: transaccion.id,
        referencia: referenciaNueva,
        urlPago: resultadoPasarela.urlPago,
        estado: resultadoPasarela.estado,
      });
    }

    // ========== CONSULTAR TRANSACCIÓN (GET con referencia) ==========
    if (req.method === 'GET' && referencia) {
      const transaccion = await prisma.transaccion.findUnique({
        where: { referencia: referencia },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
      });

      if (!transaccion) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Parsear JSON fields
      const transaccionFormateada = {
        ...transaccion,
        datosPago: transaccion.datosPago ? JSON.parse(transaccion.datosPago) : null,
        respuestaPasarela: transaccion.respuestaPasarela 
          ? JSON.parse(transaccion.respuestaPasarela) 
          : null,
      };

      return res.status(200).json({
        success: true,
        transaccion: transaccionFormateada,
      });
    }

    // ========== HISTORIAL (GET sin referencia) ==========
    // Nota: El historial requiere email del comprador para consultar sus transacciones
    if (req.method === 'GET' && !referencia) {
      const emailComprador = req.query?.email;
      
      if (!emailComprador) {
        return res.status(400).json({ 
          error: 'Se requiere el email del comprador para consultar el historial' 
        });
      }

      // Buscar transacciones por email del comprador en datosPago
      // Nota: Esto requiere una búsqueda en JSON, que puede ser lenta
      // En producción, considera agregar un índice o campo separado para email
      const todasTransacciones = await prisma.transaccion.findMany({
        where: {
          datosPago: {
            contains: emailComprador,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Filtrar por email exacto (porque contains puede dar falsos positivos)
      const transacciones = todasTransacciones.filter(t => {
        try {
          const datos = JSON.parse(t.datosPago || '{}');
          return datos.compradorEmail?.toLowerCase() === emailComprador.toLowerCase();
        } catch {
          return false;
        }
      });

      // Formatear transacciones
      const transaccionesFormateadas = transacciones.map(t => ({
        ...t,
        datosPago: t.datosPago ? JSON.parse(t.datosPago) : null,
        respuestaPasarela: t.respuestaPasarela ? JSON.parse(t.respuestaPasarela) : null,
      }));

      return res.status(200).json({
        success: true,
        transacciones: transaccionesFormateadas,
      });
    }

    // Si no coincide con ninguna ruta
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error en handler de pagos:', error);
    res.status(500).json({ 
      error: error.message || 'Error al procesar la petición' 
    });
  }
}

