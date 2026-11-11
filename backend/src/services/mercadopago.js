import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { HttpError } from '../errors/http-error.js';

const API_ORDENES = 'https://api.mercadopago.com/v1/orders';

/** Correo del pagador de prueba: no puede ser el mismo de la cuenta vendedor de Mercado Pago. */
export const CORREO_PAGADOR_PRUEBA = 'comprador.dancypet@gmail.com';

const MENSAJES_RECHAZO = {
  insufficient_amount: 'Fondos insuficientes. Con tarjetas de prueba usa el titular APRO.',
  cc_rejected_insufficient_amount: 'Fondos insuficientes. Con tarjetas de prueba usa el titular APRO.',
  bad_filled_card_data: 'Revisa los datos de la tarjeta.',
  cc_rejected_bad_filled_security_code: 'El código de seguridad es incorrecto.',
  cc_rejected_bad_filled_date: 'La fecha de vencimiento es incorrecta.',
  cc_rejected_bad_filled_other: 'Revisa los datos de la tarjeta.',
  required_call_for_authorize: 'El banco rechazó el pago. Con tarjetas de prueba usa el titular APRO.',
  cc_rejected_call_for_authorize: 'El banco rechazó el pago. Con tarjetas de prueba usa el titular APRO.',
  card_disabled: 'La tarjeta está deshabilitada.',
  cc_rejected_card_disabled: 'La tarjeta está deshabilitada.',
  high_risk: 'Mercado Pago rechazó el pago por seguridad.',
  cc_rejected_high_risk: 'Mercado Pago rechazó el pago por seguridad.',
  rejected_by_issuer: 'El banco rechazó el pago. Con tarjetas de prueba usa el titular APRO.',
  cc_rejected_other_reason: 'El pago fue rechazado. Prueba la tarjeta 5031 7557 3453 0604 con titular APRO.',
  processing_error: 'No se pudo procesar el pago. Inténtalo de nuevo.',
  invalid_installments: 'El número de cuotas no es válido.',
  max_attempts_exceeded: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  cc_rejected_duplicated_payment: 'Pago duplicado. Espera un momento e inténtalo de nuevo.',
  failed: 'El pago fue rechazado. En prueba el titular debe ser exactamente APRO (tarjeta 5031 7557 3453 0604, vence 11/30, CVV 123, DNI 12345678).',
};

/**
 * Cobra en Mercado Pago con la Orders API (la de Payments rechaza las credenciales
 * APP_USR de cuentas de prueba con "Unauthorized use of live credentials").
 */
export async function cobrarMercadoPago({ monto, descripcion, formData, items = [] }) {
  if (!config.mpAccessToken) {
    throw new HttpError(503, 'Falta MP_ACCESS_TOKEN en el archivo .env del backend');
  }

  const cuerpo = armarCuerpo({ monto, descripcion, formData, items });

  let respuesta;
  try {
    respuesta = await fetch(API_ORDENES, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw new HttpError(502, 'No se pudo contactar con Mercado Pago. Inténtalo de nuevo.');
  }

  const raw = await respuesta.json().catch(() => ({}));
  // En error, MP envuelve la orden en `{ errors, data }`; en éxito viene la orden directa.
  const orden = raw.data && (raw.errors || raw.data.transactions) ? raw.data : raw;
  const pago = orden.transactions?.payments?.[0] ?? {};
  const estado = orden.status || pago.status;
  const detalle =
    pago.status_detail ||
    orden.status_detail ||
    raw.errors?.[0]?.details?.[0]?.message ||
    raw.errors?.[0]?.details?.[0]?.code ||
    raw.errors?.[0]?.code;

  if (estado === 'processed' || estado === 'accredited') {
    return {
      metodo: 'mercadopago',
      paymentId: pago.id || orden.id,
      paymentMethod: pago.payment_method?.id || formData.payment_method_id,
      ...(formData.payer?.email && { email: formData.payer.email }),
      status: 'approved',
    };
  }

  if (!respuesta.ok || estado === 'failed' || estado === 'rejected') {
    console.error('Mercado Pago', respuesta.status, {
      estado,
      detalle,
      pago: {
        status: pago.status,
        status_detail: pago.status_detail,
        status_detail_code: pago.status_detail,
      },
      errors: raw.errors,
    });
  }

  throw new HttpError(402, mensajeDeMercadoPago(respuesta.status, raw, detalle));
}

function mensajeDeMercadoPago(status, data, detalle) {
  const causa = data.errors?.[0] || data.cause?.[0] || {};
  const detalleAnidado = Array.isArray(causa.details) ? causa.details[0] : null;
  const codigoDetalle =
    detalle ||
    detalleAnidado?.code ||
    detalleAnidado?.message ||
    causa.code;

  const texto = [
    data.message,
    data.error,
    detalle,
    causa.message,
    causa.description,
    causa.code,
    detalleAnidado?.message,
    detalleAnidado?.code,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (texto.includes('invalid users involved') || texto.includes('cannot operate between these users')) {
    return 'El correo del pagador no puede ser el de tu cuenta de Mercado Pago. Deja el correo de prueba del formulario o usa otro (por ejemplo comprador.dancypet@gmail.com).';
  }
  if (texto.includes('invalid test user email')) {
    return 'El correo del pagador no es válido en el entorno de prueba. Deja comprador.dancypet@gmail.com.';
  }
  if (texto.includes('unauthorized use of live credentials') || texto.includes('una de las partes es de prueba')) {
    return 'Mercado Pago está mezclando prueba y producción. En Developers deja el interruptor en Prueba y usa las credenciales de esa misma pantalla en MP_PUBLIC_KEY y MP_ACCESS_TOKEN.';
  }
  if (status === 401 && (texto.includes('invalid') || texto.includes('unauthorized') || texto.includes('malformed'))) {
    return 'Las credenciales de Mercado Pago no son válidas. Revisa MP_ACCESS_TOKEN en backend/.env (el Access Token largo, no la Public Key).';
  }
  return (
    MENSAJES_RECHAZO[codigoDetalle] ||
    MENSAJES_RECHAZO[detalle] ||
    MENSAJES_RECHAZO[causa.code] ||
    causa.message ||
    causa.description ||
    data.message ||
    detalle ||
    'El pago no fue aprobado. En prueba usa titular APRO.'
  );
}

function armarCuerpo({ monto, descripcion, formData }) {
  const total = (Math.round(Number(monto) * 100) / 100).toFixed(2);
  const medio = formData.payment_method_id || 'master';
  const tipo = tipoDeTarjeta(formData.payment_type_id, medio);
  const pago = {
    amount: total,
    payment_method: {
      id: medio,
      type: tipo,
      installments: Number(formData.installments) || 1,
    },
  };
  if (formData.token) pago.payment_method.token = formData.token;

  const payer = {
    email: CORREO_PAGADOR_PRUEBA,
  };
  const identificacion = formData.payer?.identification;
  if (identificacion?.type && identificacion?.number) {
    payer.identification = {
      type: String(identificacion.type),
      number: String(identificacion.number),
    };
  }

  return {
    type: 'online',
    processing_mode: 'automatic',
    total_amount: total,
    description: String(descripcion).slice(0, 80),
    external_reference: `dancypet-${randomUUID()}`,
    payer,
    transactions: {
      payments: [pago],
    },
  };
}

function tipoDeTarjeta(paymentTypeId, paymentMethodId) {
  const tipo = String(paymentTypeId || '').toLowerCase();
  if (tipo === 'debit_card' || tipo === 'credit_card') return tipo;
  const medio = String(paymentMethodId || '').toLowerCase();
  if (medio.startsWith('deb')) return 'debit_card';
  return 'credit_card';
}
