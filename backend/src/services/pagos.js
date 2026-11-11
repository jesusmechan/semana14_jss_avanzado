import { datosInvalidos } from '../errors/http-error.js';
import { esquemaPagoEfectivo } from '../validators/esquemas.js';
import { validar } from '../validators/validar.js';

export const METODOS_PAGO = ['mercadopago', 'efectivo'];

/**
 * Valida el método de pago. De Mercado Pago solo se acepta el token/formData del Brick;
 * el número de tarjeta nunca llega a esta API.
 */
export function validarPago(pago, { soloMercadoPago = false } = {}) {
  const metodo = pago?.metodo;
  const permitidos = soloMercadoPago ? ['mercadopago'] : METODOS_PAGO;
  if (!permitidos.includes(metodo)) {
    throw datosInvalidos({ metodo: `Debe ser uno de: ${permitidos.join(', ')}` });
  }

  if (metodo === 'mercadopago') {
    const formData = extraerFormData(pago);
    if (!formData.token && !formData.payment_method_id) {
      throw datosInvalidos({ pago: 'Faltan los datos del pago de Mercado Pago' });
    }
    if (!formData.payer?.email) {
      throw datosInvalidos({ email: 'El correo del pagador es obligatorio' });
    }
    return { metodo, formData };
  }

  const datos = validar(esquemaPagoEfectivo, pago);
  return { metodo, nombre: datos.nombre, telefono: datos.telefono, direccion: datos.direccion };
}

function extraerFormData(pago) {
  const formData = {};
  if (typeof pago.token === 'string' && pago.token.trim()) formData.token = pago.token.trim();
  if (typeof pago.payment_method_id === 'string' && pago.payment_method_id.trim()) {
    formData.payment_method_id = pago.payment_method_id.trim();
  }
  if (pago.installments != null && pago.installments !== '') {
    formData.installments = Number(pago.installments);
  }
  if (pago.issuer_id != null && pago.issuer_id !== '') {
    formData.issuer_id = String(pago.issuer_id);
  }
  if (pago.payer && typeof pago.payer === 'object') formData.payer = pago.payer;
  if (typeof pago.payment_type_id === 'string' && pago.payment_type_id.trim()) {
    formData.payment_type_id = pago.payment_type_id.trim();
  }
  return formData;
}
