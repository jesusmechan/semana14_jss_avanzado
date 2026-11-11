import { Link } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useToast } from '../context/ToastContext';
import type { Producto } from '../types/producto';
import { soles, truncar } from '../utils/format';
import { usarImagenRespaldo } from '../utils/imagen';
import { BadgeProducto } from './BadgeProducto';

interface Props {
  producto: Producto;
  categoria?: string;
}

export function ProductoCard({ producto, categoria = '' }: Props) {
  const carrito = useCarrito();
  const toast = useToast();

  const agregar = () => {
    carrito.agregar(producto);
    toast.mostrar(`✓ ${producto.nombre} agregado al carrito`);
  };

  return (
    <article
      className="product-card"
      style={{ display: 'block', height: '100%', transition: 'transform .3s, box-shadow .3s, border-color .3s' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <Link className="product-card__image-wrap" to={`/productos/${producto.id}`} tabIndex={-1} aria-hidden="true">
        <img
          className="product-card__image"
          src={producto.imagen}
          alt={producto.nombre}
          loading="lazy"
          onError={usarImagenRespaldo}
        />
        {producto.badge && <BadgeProducto badge={producto.badge} />}
      </Link>
      <div className="product-card__body">
        <span className="product-card__category">{categoria || producto.categoria}</span>
        <h3 className="product-card__name">
          <Link to={`/productos/${producto.id}`}>{producto.nombre}</Link>
        </h3>
        <p className="product-card__desc">{truncar(producto.descripcion, 90)}</p>
        <div className="product-card__footer">
          <div>
            <span className="product-card__price">{soles(producto.precio)}</span>
            {producto.precioAnterior != null && (
              <span className="product-card__price-old">{soles(producto.precioAnterior)}</span>
            )}
          </div>
          <button
            className="product-card__add"
            type="button"
            onClick={agregar}
            disabled={!producto.disponible}
            aria-label={`Agregar ${producto.nombre} al carrito`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
