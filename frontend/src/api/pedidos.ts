import type { ItemCarrito } from '../types/carrito';
import type { Entrega } from '../types/mascota';
import type { Pago, PagoMercadoPago, Pedido } from '../types/pedido';
import { apiAxios } from './axiosClient';

/** Pedidos y pagos vía Axios (Semana 14). */

export function configPagos(): Promise<{ publicKey: string }> {
  return apiAxios<{ publicKey: string }>('/pagos/config');
}

export function listarPedidos(): Promise<Pedido[]> {
  return apiAxios<Pedido[]>('/pedidos');
}

export function comprar(items: ItemCarrito[], pago: Pago): Promise<Pedido> {
  return apiAxios<Pedido>('/pedidos', {
    method: 'POST',
    data: {
      tipo: 'compra',
      items: items.map(({ producto, cantidad }) => ({ productoId: producto.id, cantidad })),
      pago,
    },
  });
}

export function suscribir(mascotaId: number, entrega: Entrega, pago: PagoMercadoPago): Promise<Pedido> {
  return apiAxios<Pedido>('/pedidos', {
    method: 'POST',
    data: { tipo: 'suscripcion', mascotaId, entrega, pago },
  });
}
