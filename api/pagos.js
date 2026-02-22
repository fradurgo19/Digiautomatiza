// Vercel Serverless Function - Pagos Unificado (Crear, Consultar, Historial, Webhook)
// Pasarelas: payu | mercado-pago (PAYMENT_PROVIDER en Vercel)
// Mercado Pago: configurar MERCADOPAGO_ACCESS_TOKEN y en MP Panel → IPN/Webhooks la URL: https://www.digiautomatiza.co/api/pagos
import prisma from './lib/prisma.mjs';
import { setCORSHeaders } from './lib/cors.mjs';
import crypto from 'node:crypto';

// Obtener la pasarela configurada (default: payu). Para Mercado Pago usar PAYMENT_PROVIDER=mercado-pago
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

/**
 * Crear pago con Mercado Pago (Checkout Pro - Preference)
 * Documentación: https://www.mercadopago.com.co/developers/en/reference/preferences/_checkout_preferences/post
 */
async function crearPagoMercadoPago(datos, referencia) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurada');
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://www.digiautomatiza.co';
  const notificationUrl = `${baseUrl}/api/pagos`;
  const backUrl = `${baseUrl}/#pagos`;

  const payload = {
    items: [
      {
        id: referencia,
        title: datos.descripcion.substring(0, 256),
        quantity: 1,
        unit_price: Number.parseFloat(datos.valor),
        currency_id: 'COP',
      },
    ],
    payer: {
      email: datos.compradorEmail,
      name: datos.compradorNombre,
      ...(datos.compradorTelefono && { phone: { number: datos.compradorTelefono } }),
    },
    external_reference: referencia,
    notification_url: notificationUrl,
    back_urls: {
      success: backUrl,
      failure: backUrl,
      pending: backUrl,
    },
    auto_return: 'approved',
    statement_descriptor: 'DIGIAUTOMATIZA',
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (result.id && result.init_point) {
    return {
      success: true,
      transactionId: result.id,
      referencia,
      urlPago: result.init_point,
      estado: 'pendiente',
      respuestaCompleta: result,
    };
  }

  const errorMsg = result.message || result.error || 'Error al crear preferencia en Mercado Pago';
  throw new Error(Array.isArray(result.cause) ? result.cause.map((c) => c.description).join('; ') : errorMsg);
}

/**
 * Mapear estado de Mercado Pago a estado interno
 */
function mapearEstadoMercadoPago(status) {
  const estados = {
    pending: 'pendiente',
    approved: 'aprobada',
    rejected: 'rechazada',
    cancelled: 'cancelada',
    in_process: 'procesando',
    in_mediation: 'procesando',
    refunded: 'cancelada',
    charged_back: 'rechazada',
  };
  return estados[status] || 'pendiente';
}

async function handleWebhookMercadoPago(req, res, notifId) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) return;
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${notifId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payment = await payRes.json();
    const externalRef = payment.external_reference;
    const status = payment.status;
    if (!externalRef) return;
    const transaccion = await prisma.transaccion.findUnique({
      where: { referencia: externalRef },
    });
    if (!transaccion) return;
    const estadoNuevo = mapearEstadoMercadoPago(status);
    const datosActualizacion = {
      estado: estadoNuevo,
      respuestaPasarela: JSON.stringify(payment),
      transactionId: String(payment.id),
    };
    if (estadoNuevo === 'aprobada') {
      datosActualizacion.fechaPago = new Date();
      datosActualizacion.fechaConfirmacion = new Date();
    }
    await prisma.transaccion.update({
      where: { id: transaccion.id },
      data: datosActualizacion,
    });
    console.log(`✅ MP Transacción ${externalRef} actualizada a: ${estadoNuevo}`);
  } catch (err) {
    console.error('Error procesando webhook Mercado Pago:', err);
  }
}

async function handleWebhookPayU(req, res) {
  const datos = req.body;
  if (datos.signature) {
    const esValida = verificarFirmaPayU(datos, datos.signature);
    if (!esValida) {
      console.error('⚠️ Firma de webhook inválida');
      return res.status(400).json({ error: 'Firma inválida' });
    }
  }
  const referenciaWebhook = datos.referenceCode || datos.reference_sale;
  if (!referenciaWebhook) {
    return res.status(400).json({ error: 'Referencia no encontrada' });
  }
  const transaccion = await prisma.transaccion.findUnique({
    where: { referencia: referenciaWebhook },
  });
  if (!transaccion) {
    console.error(`⚠️ Transacción no encontrada: ${referenciaWebhook}`);
    return res.status(404).json({ error: 'Transacción no encontrada' });
  }
  const estadoPayU = datos.state || datos.transactionState;
  const estadoNuevo = mapearEstadoPayU(estadoPayU);
  const datosActualizacion = {
    estado: estadoNuevo,
    respuestaPasarela: JSON.stringify(datos),
    transactionId: datos.transactionId || datos.transaction_id || transaccion.transactionId,
  };
  if (estadoNuevo === 'aprobada') {
    datosActualizacion.fechaPago = new Date();
    datosActualizacion.fechaConfirmacion = new Date();
  }
  await prisma.transaccion.update({
    where: { id: transaccion.id },
    data: datosActualizacion,
  });
  console.log(`✅ Transacción ${referenciaWebhook} actualizada a estado: ${estadoNuevo}`);
  return res.status(200).json({ success: true, message: 'Webhook procesado correctamente' });
}

async function handleCrearPago(req, res) {
  const {
    valor, descripcion, metodoPago, datosAdicionales,
    compradorNombre, compradorEmail, compradorTelefono, compradorDocumento,
  } = req.body;

  if (!valor || valor <= 0) {
    return res.status(400).json({ error: 'El valor debe ser mayor a 0' });
  }
  if (!descripcion) {
    return res.status(400).json({ error: 'La descripción es requerida' });
  }
  if (!compradorEmail || !compradorNombre) {
    return res.status(400).json({ error: 'Email y nombre del comprador son requeridos' });
  }

  const referenciaNueva = generarReferencia();
  const valorNum = Number.parseFloat(String(valor));

  const transaccion = await prisma.transaccion.create({
    data: {
      usuarioId: null,
      referencia: referenciaNueva,
      pasarela: PAYMENT_PROVIDER,
      estado: 'pendiente',
      metodoPago: metodoPago || null,
      valor: valorNum,
      moneda: 'COP',
      descripcion: descripcion,
      datosPago: JSON.stringify({
        compradorNombre,
        compradorEmail,
        compradorTelefono: compradorTelefono || '',
        compradorDocumento: compradorDocumento || '',
        ...datosAdicionales,
      }),
    },
  });

  let resultadoPasarela;
  if (PAYMENT_PROVIDER === 'payu') {
    resultadoPasarela = await crearPagoPayU({
      valor: valorNum,
      descripcion,
      compradorEmail,
      compradorNombre,
      compradorTelefono: compradorTelefono || '',
      compradorDocumento: compradorDocumento || '',
    });
  } else if (PAYMENT_PROVIDER === 'mercado-pago') {
    resultadoPasarela = await crearPagoMercadoPago(
      {
        valor: valorNum,
        descripcion,
        compradorEmail,
        compradorNombre,
        compradorTelefono: compradorTelefono || '',
        compradorDocumento: compradorDocumento || '',
      },
      referenciaNueva
    );
  } else {
    return res.status(400).json({ error: `Pasarela ${PAYMENT_PROVIDER} no implementada aún` });
  }

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

async function handleGetTransaccion(res, referencia) {
  const transaccion = await prisma.transaccion.findUnique({
    where: { referencia },
    include: {
      usuario: { select: { id: true, nombre: true, email: true } },
    },
  });
  if (!transaccion) {
    return res.status(404).json({ error: 'Transacción no encontrada' });
  }
  const transaccionFormateada = {
    ...transaccion,
    datosPago: transaccion.datosPago ? JSON.parse(transaccion.datosPago) : null,
    respuestaPasarela: transaccion.respuestaPasarela ? JSON.parse(transaccion.respuestaPasarela) : null,
  };
  return res.status(200).json({ success: true, transaccion: transaccionFormateada });
}

async function handleGetHistorial(res, emailComprador) {
  const todasTransacciones = await prisma.transaccion.findMany({
    where: { datosPago: { contains: emailComprador } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const transacciones = todasTransacciones.filter((t) => {
    try {
      const datos = JSON.parse(t.datosPago || '{}');
      return datos.compradorEmail?.toLowerCase() === emailComprador.toLowerCase();
    } catch {
      return false;
    }
  });
  const transaccionesFormateadas = transacciones.map((t) => ({
    ...t,
    datosPago: t.datosPago ? JSON.parse(t.datosPago) : null,
    respuestaPasarela: t.respuestaPasarela ? JSON.parse(t.respuestaPasarela) : null,
  }));
  return res.status(200).json({ success: true, transacciones: transaccionesFormateadas });
}

/** Devuelve true si la petición fue un webhook y ya se respondió. */
async function tryHandleWebhooks(req, res) {
  const topic = req.query?.topic || req.body?.topic;
  const notifId = req.query?.id || req.body?.id;
  const isGetOrPost = req.method === 'GET' || req.method === 'POST';
  if (isGetOrPost && topic && notifId && PAYMENT_PROVIDER === 'mercado-pago') {
    if (topic === 'payment') await handleWebhookMercadoPago(req, res, notifId);
    res.status(200).end();
    return true;
  }
  const isPayUWebhook = req.method === 'POST' && !req.body?.valor && (req.body?.referenceCode || req.body?.reference_sale);
  if (isPayUWebhook) {
    if (PAYMENT_PROVIDER === 'payu') {
      await handleWebhookPayU(req, res);
      return true;
    }
    res.status(400).json({ error: `Webhook para ${PAYMENT_PROVIDER} no implementado` });
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  setCORSHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const referencia = req.query?.referencia;

  try {
    if (await tryHandleWebhooks(req, res)) return;

    if (req.method === 'POST' && req.body?.valor) {
      return await handleCrearPago(req, res);
    }

    if (req.method === 'GET' && referencia) {
      return await handleGetTransaccion(res, referencia);
    }

    if (req.method === 'GET' && !referencia) {
      const emailComprador = req.query?.email;
      if (!emailComprador) {
        return res.status(400).json({ error: 'Se requiere el email del comprador para consultar el historial' });
      }
      return await handleGetHistorial(res, emailComprador);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error en handler de pagos:', error);
    res.status(500).json({ error: error.message || 'Error al procesar la petición' });
  }
}

