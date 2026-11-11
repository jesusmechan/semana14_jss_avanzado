import type { ItemCarrito } from '../types/carrito';
import type { Entrega } from '../types/mascota';
import type { Pago, PagoMercadoPago, Pedido } from '../types/pedido';
import { apiFetch } from './client';

export function configPagos(): Promise<{ publicKey: string }> {
  return apiFetch<{ publicKey: string }>('/pagos/config');
}

export function listarPedidos(): Promise<Pedido[]> {
  return apiFetch<Pedido[]>('/pedidos');
}

export function comprar(items: ItemCarrito[], pago: Pago): Promise<Pedido> {
  return apiFetch<Pedido>('/pedidos', {
    method: 'POST',
    body: JSON.stringify({
      tipo: 'compra',
      items: items.map(({ producto, cantidad }) => ({ productoId: producto.id, cantidad })),
      pago,
    }),
  });
}

export function suscribir(mascotaId: number, entrega: Entrega, pago: PagoMercadoPago): Promise<Pedido> {
  return apiFetch<Pedido>('/pedidos', {
    method: 'POST',
    body: JSON.stringify({ tipo: 'suscripcion', mascotaId, entrega, pago }),
  });
}
