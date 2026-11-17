import type { Categoria } from '../types/producto';
import { alova } from './alovaClient';

/** Method de Alova para listar categorías (resource hook / useRequest). */
export function categoriasMethod() {
  return alova.Get<Categoria[]>('/categorias');
}

/** Lista categorías con Alova (también usable fuera de hooks). */
export function listarCategoriasAlova(): Promise<Categoria[]> {
  return categoriasMethod();
}
