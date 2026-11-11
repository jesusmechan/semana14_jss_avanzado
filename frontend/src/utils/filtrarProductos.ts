import type { Orden, Producto } from '../types/producto';

const PALABRAS = /[a-záéíóúñ0-9]+/gi;

function coincide(texto: string, consulta: string): boolean {
  const normalizado = texto.toLowerCase();
  if (normalizado.includes(consulta)) return true;
  return (texto.match(PALABRAS) ?? []).some((palabra) => palabra.toLowerCase().startsWith(consulta));
}

const COMPARADORES: Record<Exclude<Orden, 'default'>, (a: Producto, b: Producto) => number> = {
  'price-asc': (a, b) => a.precio - b.precio,
  'price-desc': (a, b) => b.precio - a.precio,
  'name-asc': (a, b) => a.nombre.localeCompare(b.nombre),
};

export function filtrarProductos(
  productos: Producto[],
  categoria: string,
  texto: string,
  orden: Orden,
): Producto[] {
  const consulta = texto.trim().toLowerCase();
  const filtrados = productos.filter(
    (p) =>
      (categoria === 'todos' || p.categoria === categoria) &&
      (!consulta || coincide(p.nombre, consulta) || coincide(p.descripcion, consulta) || coincide(p.tipo, consulta)),
  );
  return orden === 'default' ? filtrados : [...filtrados].sort(COMPARADORES[orden]);
}
