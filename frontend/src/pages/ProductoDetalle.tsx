import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { listarCategoriasAlova } from '../api/categorias';
import { mensajeDeError } from '../api/client';
import { obtenerProducto } from '../api/productos';
import { BadgeProducto } from '../components/BadgeProducto';
import { MAX_CANTIDAD, useCarrito } from '../context/CarritoContext';
import { useToast } from '../context/ToastContext';
import { useResource } from '../hooks/useResource';
import type { Producto } from '../types/producto';
import { soles, titleCase } from '../utils/format';
import { usarImagenRespaldo } from '../utils/imagen';

interface DetalleCarga {
  producto: Producto;
  categoria: string;
}

export function ProductoDetalle() {
  const { id } = useParams();
  const carrito = useCarrito();
  const toast = useToast();
  const navigate = useNavigate();
  const [cantidad, setCantidad] = useState(1);

  // Resource Hook: combina Fetch (producto) + Alova (categorías)
  const { data, error } = useResource<DetalleCarga>(
    async () => {
      if (!id) throw new Error('Producto no válido');
      const [prod, cats] = await Promise.all([obtenerProducto(+id), listarCategoriasAlova()]);
      return {
        producto: prod,
        categoria: cats.find((c) => c.clave === prod.categoria)?.nombre ?? prod.categoria,
      };
    },
    [id],
    (err) => mensajeDeError(err, 'No se encontró el producto.'),
  );

  const producto = data?.producto;
  const categoria = data?.categoria ?? '';

  useEffect(() => {
    document.title = producto ? `${producto.nombre} | DancyPet` : 'Producto | DancyPet';
  }, [producto]);

  const ahorro = producto?.precioAnterior ? producto.precioAnterior - producto.precio : 0;

  const cambiarCantidad = (delta: number) => {
    setCantidad((c) => Math.min(Math.max(c + delta, 1), MAX_CANTIDAD));
  };

  const agregar = () => {
    if (!producto) return;
    carrito.agregar(producto, cantidad);
    toast.mostrar(`✓ ${cantidad} × ${producto.nombre} agregado al carrito`);
  };

  const comprarAhora = () => {
    agregar();
    navigate('/pago');
  };

  return (
    <section className="page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <Link to="/">Inicio</Link>
          <span>/</span>
          <Link to="/productos">Productos</Link>
          {producto && (
            <>
              <span>/</span>
              <Link to={`/productos?categoria=${producto.categoria}`}>{categoria}</Link>
            </>
          )}
        </nav>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error} <Link to="/productos">Volver al catálogo</Link>
          </div>
        )}

        {producto && (
          <article className="product-detail">
            <div className="product-detail__image">
              <img src={producto.imagen} alt={producto.nombre} onError={usarImagenRespaldo} />
              {producto.badge && <BadgeProducto badge={producto.badge} />}
            </div>
            <div className="product-detail__info">
              <span className="product-card__category">
                {categoria} · {titleCase(producto.tipo)}
              </span>
              <h1>{producto.nombre}</h1>
              <p className="product-detail__desc">{producto.descripcion}</p>
              <div className="product-detail__price">
                <span className="product-card__price">{soles(producto.precio)}</span>
                {producto.precioAnterior != null && (
                  <>
                    <span className="product-card__price-old">{soles(producto.precioAnterior)}</span>
                    <span className="product-detail__saving">Ahorras {soles(ahorro)}</span>
                  </>
                )}
              </div>
              {producto.disponible ? (
                <>
                  <div className="product-detail__qty">
                    <span>Cantidad</span>
                    <button
                      className="qty-btn"
                      type="button"
                      onClick={() => cambiarCantidad(-1)}
                      disabled={cantidad <= 1}
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>
                    <span className="cart-item__qty">{cantidad}</span>
                    <button
                      className="qty-btn"
                      type="button"
                      onClick={() => cambiarCantidad(1)}
                      disabled={cantidad >= MAX_CANTIDAD}
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                  <div className="product-detail__actions">
                    <button className="btn btn--primary btn--lg" type="button" onClick={agregar}>
                      Agregar al carrito
                    </button>
                    <button className="btn btn--outline btn--lg" type="button" onClick={comprarAhora}>
                      Comprar ahora
                    </button>
                  </div>
                </>
              ) : (
                <p className="alert alert-warning" role="alert">
                  Producto no disponible por el momento.
                </p>
              )}
              <ul className="about__list product-detail__perks">
                <li>🚚 Entrega en 24-48 horas en Lima Metropolitana</li>
                <li>↩️ 30 días para devoluciones</li>
                <li>🔒 Pago seguro con Mercado Pago o contra entrega</li>
              </ul>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
