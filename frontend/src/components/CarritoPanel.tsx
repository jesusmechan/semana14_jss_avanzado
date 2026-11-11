import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useToast } from '../context/ToastContext';
import { soles } from '../utils/format';
import { usarImagenRespaldo } from '../utils/imagen';

export function CarritoPanel() {
  const carrito = useCarrito();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') carrito.setAbierto(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [carrito]);

  const cerrar = () => carrito.setAbierto(false);

  const finalizarCompra = () => {
    cerrar();
    navigate('/pago');
  };

  const vaciar = () => {
    if (!confirm('¿Estás seguro de vaciar el carrito?')) return;
    carrito.vaciar();
    toast.mostrar('Carrito vaciado');
  };

  return (
    <>
      <div className={`cart-overlay${carrito.abierto ? ' active' : ''}`} onClick={cerrar} />

      <aside
        className={`cart-panel${carrito.abierto ? ' active' : ''}`}
        aria-label="Carrito de compras"
        aria-hidden={!carrito.abierto}
        inert={!carrito.abierto ? true : undefined}
      >
        <div className="cart-header">
          <h2>🛒 Tu carrito</h2>
          <button className="btn-icon" type="button" onClick={cerrar} aria-label="Cerrar carrito">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="cart-items">
          {carrito.estaVacio && (
            <div className="cart-empty">
              <span className="cart-empty-icon">🐱</span>
              <p>Tu carrito está vacío</p>
              <small>¡Agrega productos para consentir a tu gato!</small>
            </div>
          )}

          {carrito.items.map((item) => (
            <div className="cart-item" key={item.producto.id}>
              <img
                className="cart-item__image"
                src={item.producto.imagen}
                alt={item.producto.nombre}
                onError={usarImagenRespaldo}
              />
              <div className="cart-item__info">
                <div className="cart-item__name">{item.producto.nombre}</div>
                <div className="cart-item__price">{soles(item.producto.precio)}</div>
                <div className="cart-item__controls">
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => carrito.cambiarCantidad(item.producto.id, -1)}
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span className="cart-item__qty">{item.cantidad}</span>
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={() => carrito.cambiarCantidad(item.producto.id, 1)}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="cart-item__remove"
                type="button"
                onClick={() => carrito.eliminar(item.producto.id)}
                aria-label={`Eliminar ${item.producto.nombre}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {!carrito.estaVacio && (
          <div className="cart-footer">
            <div className="cart-summary">
              <span>Subtotal</span>
              <span>{soles(carrito.subtotal)}</span>
            </div>
            <div className="cart-summary">
              <span>IGV (18%)</span>
              <span>{soles(carrito.igv)}</span>
            </div>
            <div className="cart-summary cart-summary--total">
              <span>Total</span>
              <span>{soles(carrito.total)}</span>
            </div>
            <button className="btn btn--primary btn--full" type="button" onClick={finalizarCompra}>
              Finalizar compra
            </button>
            <button className="btn btn--ghost btn--full" type="button" onClick={vaciar}>
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
