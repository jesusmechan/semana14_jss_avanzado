import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { mensajeDeError } from '../api/client';
import { listarCategorias, obtenerProducto } from '../api/productos';
import { BadgeProducto } from '../components/BadgeProducto';
import { MAX_CANTIDAD, useCarrito } from '../context/CarritoContext';
import { useToast } from '../context/ToastContext';
import type { Producto } from '../types/producto';
import { soles, titleCase } from '../utils/format';
import { usarImagenRespaldo } from '../utils/imagen';

export function ProductoDetalle() {
  const { id } = useParams();
  const carrito = useCarrito();
  const toast = useToast();
  const navigate = useNavigate();

  const [producto, setProducto] = useState<Producto>();
  const [categoria, setCategoria] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Producto | DancyPet';
    if (!id) return;
    Promise.all([obtenerProducto(+id), listarCategorias()])
      .then(([prod, cats]) => {
        setProducto(prod);
        setCategoria(cats.find((c) => c.clave === prod.categoria)?.nombre ?? prod.categoria);
        document.title = `${prod.nombre} | DancyPet`;
      })
      .catch((err) => setError(mensajeDeError(err, 'No se encontró el producto.')));
  }, [id]);

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
          <div className="alert alert--error">
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
                <p className="alert alert--error">Producto no disponible por el momento.</p>
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
