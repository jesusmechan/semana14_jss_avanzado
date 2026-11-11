import type { Entrega } from './mascota';

export type MetodoPago = 'mercadopago' | 'efectivo' | 'tarjeta' | 'yape';

export interface PagoMercadoPago {
  metodo: 'mercadopago';
  token?: string;
  payment_method_id?: string;
  installments?: number;
  issuer_id?: string | number;
  payer?: {
    email?: string;
    identification?: { type: string; number: string };
  };
}

export interface PagoEfectivo {
  metodo: 'efectivo';
  nombre: string;
  telefono: string;
  direccion: string;
}

export type Pago = PagoMercadoPago | PagoEfectivo;

export interface LineaPedido {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface Pedido {
  id: number;
  numero: string;
  tipo: 'compra' | 'suscripcion';
  items?: LineaPedido[];
  mascotaNombre?: string;
  entrega?: Entrega;
  subtotal: number;
  igv: number;
  total: number;
  pago: {
    metodo: MetodoPago;
    ultimos4?: string;
    paymentMethod?: string;
    paymentId?: string | number;
    status?: string;
  };
  estado: string;
  fecha: string;
}
