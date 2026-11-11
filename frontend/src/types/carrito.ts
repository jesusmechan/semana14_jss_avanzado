import type { Producto } from './producto';

export type ProductoEnCarrito = Pick<Producto, 'id' | 'nombre' | 'precio' | 'imagen'>;

export interface ItemCarrito {
  producto: ProductoEnCarrito;
  cantidad: number;
}
