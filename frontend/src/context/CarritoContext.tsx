import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ItemCarrito, ProductoEnCarrito } from '../types/carrito';

const STORAGE_KEY = 'dancypet-cart';
export const IGV_PORCENTAJE = 0.18;
export const MAX_CANTIDAD = 99;

const redondear = (valor: number) => Math.round(valor * 100) / 100;

function cargar(): ItemCarrito[] {
  try {
    const datos: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(datos)) return [];
    return (datos as Record<string, unknown>[])
      .filter(
        (d) =>
          Number.isInteger(d?.id) &&
          typeof d.precio === 'number' &&
          Number.isInteger(d.cantidad) &&
          (d.cantidad as number) > 0,
      )
      .map((d) => ({
        producto: {
          id: d.id as number,
          nombre: String(d.nombre),
          precio: d.precio as number,
          imagen: String(d.imagen),
        },
        cantidad: Math.min(d.cantidad as number, MAX_CANTIDAD),
      }));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

interface CarritoContextValue {
  items: ItemCarrito[];
  abierto: boolean;
  setAbierto: (abierto: boolean) => void;
  cantidadTotal: number;
  subtotal: number;
  igv: number;
  total: number;
  estaVacio: boolean;
  agregar: (producto: ProductoEnCarrito, cantidad?: number) => void;
  cambiarCantidad: (id: number, delta: number) => void;
  eliminar: (id: number) => void;
  vaciar: () => void;
}

const CarritoContext = createContext<CarritoContextValue | null>(null);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(() => cargar());
  const [abierto, setAbierto] = useState(false);

  const persistir = useCallback((nuevos: ItemCarrito[]) => {
    setItems(nuevos);
    try {
      const datos = nuevos.map(({ producto, cantidad }) => ({ ...producto, cantidad }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
    } catch (error) {
      console.error('No se pudo guardar el carrito:', error);
    }
  }, []);

  const agregar = useCallback(
    (producto: ProductoEnCarrito, cantidad = 1) => {
      setItems((actuales) => {
        const existente = actuales.find((item) => item.producto.id === producto.id);
        let nuevos: ItemCarrito[];
        if (existente) {
          nuevos = actuales
            .map((item) =>
              item.producto.id === producto.id
                ? { ...item, cantidad: Math.min(item.cantidad + cantidad, MAX_CANTIDAD) }
                : item,
            )
            .filter((item) => item.cantidad > 0);
        } else {
          nuevos = [
            ...actuales,
            {
              producto: {
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagen,
              },
              cantidad: Math.min(cantidad, MAX_CANTIDAD),
            },
          ];
        }
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(nuevos.map(({ producto: p, cantidad: c }) => ({ ...p, cantidad: c }))),
          );
        } catch (error) {
          console.error('No se pudo guardar el carrito:', error);
        }
        return nuevos;
      });
    },
    [],
  );

  const cambiarCantidad = useCallback((id: number, delta: number) => {
    setItems((actuales) => {
      const nuevos = actuales
        .map((item) =>
          item.producto.id === id
            ? { ...item, cantidad: Math.min(item.cantidad + delta, MAX_CANTIDAD) }
            : item,
        )
        .filter((item) => item.cantidad > 0);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nuevos.map(({ producto: p, cantidad: c }) => ({ ...p, cantidad: c }))),
        );
      } catch (error) {
        console.error('No se pudo guardar el carrito:', error);
      }
      return nuevos;
    });
  }, []);

  const eliminar = useCallback(
    (id: number) => {
      persistir(items.filter((item) => item.producto.id !== id));
    },
    [items, persistir],
  );

  const vaciar = useCallback(() => persistir([]), [persistir]);

  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  const subtotal = useMemo(
    () => redondear(items.reduce((acum, item) => acum + item.producto.precio * item.cantidad, 0)),
    [items],
  );
  const igv = useMemo(() => redondear(subtotal * IGV_PORCENTAJE), [subtotal]);
  const total = useMemo(() => redondear(subtotal + igv), [subtotal, igv]);
  const cantidadTotal = useMemo(
    () => items.reduce((acum, item) => acum + item.cantidad, 0),
    [items],
  );

  const value = useMemo<CarritoContextValue>(
    () => ({
      items,
      abierto,
      setAbierto,
      cantidadTotal,
      subtotal,
      igv,
      total,
      estaVacio: items.length === 0,
      agregar,
      cambiarCantidad,
      eliminar,
      vaciar,
    }),
    [items, abierto, cantidadTotal, subtotal, igv, total, agregar, cambiarCantidad, eliminar, vaciar],
  );

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
}

export function useCarrito(): CarritoContextValue {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  return ctx;
}
