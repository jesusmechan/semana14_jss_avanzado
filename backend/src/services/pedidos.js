import { datosInvalidos, HttpError, noEncontrado } from '../errors/http-error.js';
import { esquemaEntrega } from '../validators/esquemas.js';
import { validar } from '../validators/validar.js';
import { calcularSuscripcion } from './suscripcion.js';

export const IGV_PORCENTAJE = 0.18;
const NUMERO_PEDIDO_BASE = 1_000_000n;
const MAX_ITEMS = 50;
const MAX_CANTIDAD = 99;

const redondear = (valor) => Math.round(valor * 100) / 100;

/** Número visible del pedido; BigInt evita perder precisión si la secuencia crece mucho. */
export const numeroPedido = (id) => (NUMERO_PEDIDO_BASE + BigInt(id)).toString();

/**
 * Arma las líneas de una compra con los precios del catálogo:
 * el cliente solo envía `productoId` y `cantidad`, nunca el precio.
 */
export function construirCompra(items, productos) {
  if (!Array.isArray(items) || items.length === 0) {
    throw datosInvalidos({ items: 'El carrito está vacío' });
  }
  if (items.length > MAX_ITEMS) {
    throw datosInvalidos({ items: `Como máximo ${MAX_ITEMS} productos distintos por pedido` });
  }

  const lineas = items.map(({ productoId, cantidad } = {}, i) => {
    if (!Number.isInteger(productoId)) {
      throw datosInvalidos({ [`items[${i}].productoId`]: 'Debe ser un número entero' });
    }
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD) {
      throw datosInvalidos({ [`items[${i}].cantidad`]: `Debe ser un entero entre 1 y ${MAX_CANTIDAD}` });
    }
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) throw noEncontrado('Producto', productoId);
    if (!producto.disponible) throw new HttpError(409, `"${producto.nombre}" no está disponible`);
    return { productoId, nombre: producto.nombre, precio: producto.precio, cantidad };
  });

  const subtotal = redondear(lineas.reduce((acum, l) => acum + l.precio * l.cantidad, 0));
  const igv = redondear(subtotal * IGV_PORCENTAJE);
  return { items: lineas, subtotal, igv, total: redondear(subtotal + igv) };
}

/** Valida la mascota y la entrega de una suscripción y calcula el cargo mensual. */
export function construirSuscripcion({ mascotaId, entrega }, mascotas, usuarioId) {
  const mascota = mascotas.find((m) => m.id === mascotaId && m.usuarioId === usuarioId);
  if (!mascota) throw noEncontrado('Mascota', mascotaId);
  if (mascota.suscripcionActiva) throw new HttpError(409, `${mascota.nombre} ya tiene una suscripción activa`);

  const datosEntrega = validar(esquemaEntrega, entrega ?? {});
  const { precioMensualFinal } = calcularSuscripcion(mascota);
  return {
    mascota,
    entrega: datosEntrega,
    detalle: {
      mascotaId: mascota.id,
      mascotaNombre: mascota.nombre,
      entrega: datosEntrega,
      subtotal: precioMensualFinal,
      igv: 0,
      total: precioMensualFinal,
    },
  };
}
