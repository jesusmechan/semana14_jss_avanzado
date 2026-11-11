export type Badge = 'sale' | 'new' | 'popular';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  precioAnterior: number | null;
  categoria: string;
  tipo: string;
  imagen: string;
  badge: Badge | null;
  disponible: boolean;
}

export interface Categoria {
  id: number;
  clave: string;
  nombre: string;
  icono: string;
  subtitulo: string;
}

export type Orden = 'default' | 'price-asc' | 'price-desc' | 'name-asc';
