import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function NoEncontrado() {
  useEffect(() => {
    document.title = '404 | DancyPet';
  }, []);

  return (
    <section className="page">
      <div className="container checkout-empty">
        <span className="cart-empty-icon">🐱</span>
        <h2>404 · Página no encontrada</h2>
        <p>Esta página se escondió detrás del sofá. Prueba con otra ruta.</p>
        <Link to="/" className="btn btn--primary">
          Ir al inicio
        </Link>
      </div>
    </section>
  );
}
