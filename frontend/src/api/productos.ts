import type { Categoria, Producto } from '../types/producto';
import { apiFetch } from './client';

export function listarProductos(): Promise<Producto[]> {
  return apiFetch<Producto[]>('/productos');
}

export function obtenerProducto(id: number): Promise<Producto> {
  return apiFetch<Producto>(`/productos/${id}`);
}

export function listarCategorias(): Promise<Categoria[]> {
  return apiFetch<Categoria[]>('/categorias');
}
