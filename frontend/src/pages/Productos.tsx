import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../api/client';
import { listarCategorias, listarProductos } from '../api/productos';
import { ProductoCard } from '../components/ProductoCard';
import type { Categoria, Orden, Producto } from '../types/producto';
import { filtrarProductos } from '../utils/filtrarProductos';

const ordenes: { valor: Orden; texto: string }[] = [
  { valor: 'default', texto: 'Ordenar por' },
  { valor: 'price-asc', texto: 'Precio: menor a mayor' },
  { valor: 'price-desc', texto: 'Precio: mayor a menor' },
  { valor: 'name-asc', texto: 'Nombre: A-Z' },
];

export function Productos() {
  const [searchParams] = useSearchParams();
  const categoriaActiva = searchParams.get('categoria') || 'todos';

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<Orden>('default');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Tienda | DancyPet';
    const minDelay = new Promise((r) => setTimeout(r, 500));
    Promise.all([listarProductos(), listarCategorias(), minDelay])
      .then(([prods, cats]) => {
        setProductos(prods);
        setCategorias(cats);
        setCargando(false);
      })
      .catch((err) => {
        setError(mensajeDeError(err));
        setCargando(false);
      });
  }, []);

  const filtrados = useMemo(
    () => filtrarProductos(productos, categoriaActiva, busqueda, orden),
    [productos, categoriaActiva, busqueda, orden],
  );

  const nombreCategoria = (clave: string) => categorias.find((c) => c.clave === clave)?.nombre ?? clave;

  const limpiarFiltros = () => {
    setBusqueda('');
    setOrden('default');
  };

  return (
    <section className="page">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Tienda 100% felina</span>
          <h2>Productos para tu gato</h2>
          <p>Filtra por necesidad, busca por nombre y ordena por precio.</p>
        </div>

        <div className="categories__grid categories__grid--compact">
          <Link className={`category-card${categoriaActiva === 'todos' ? ' active' : ''}`} to="/productos">
            <span className="category-card__icon">🐱</span>
            <span className="category-card__name">Todos</span>
          </Link>
          {categorias.map((c) => (
            <Link
              key={c.clave}
              className={`category-card${categoriaActiva === c.clave ? ' active' : ''}`}
              to={`/productos?categoria=${c.clave}`}
            >
              <span className="category-card__icon">{c.icono}</span>
              <span className="category-card__name">{c.nombre}</span>
            </Link>
          ))}
        </div>

        <div className="products__toolbar">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Buscar productos..."
              aria-label="Buscar productos"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            className="sort-select"
            aria-label="Ordenar productos"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
          >
            {ordenes.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.texto}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        {cargando && (
          <div className="products__grid" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="product-card skeleton" key={i}>
                <div className="skeleton__image"></div>
                <div className="product-card__body">
                  <div className="skeleton__line skeleton__line--short"></div>
                  <div className="skeleton__line"></div>
                  <div className="skeleton__line"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!cargando && !error && (
          <>
            <p className="products__count">
              Mostrando <strong>{filtrados.length}</strong> de {productos.length} productos
            </p>
            {filtrados.length ? (
              <div className="products__grid">
                {filtrados.map((p) => (
                  <ProductoCard key={p.id} producto={p} categoria={nombreCategoria(p.categoria)} />
                ))}
              </div>
            ) : (
              <div className="products__empty">
                <p>No se encontraron productos con esos criterios.</p>
                <button className="btn btn--outline" type="button" onClick={limpiarFiltros}>
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
