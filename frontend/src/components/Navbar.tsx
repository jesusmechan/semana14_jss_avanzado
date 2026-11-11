import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';

const enlaces = [
  { to: '/#inicio', texto: 'Inicio', seccion: true },
  { to: '/productos', texto: 'Tienda', seccion: false },
  { to: '/#categorias', texto: 'Categorías', seccion: true },
  { to: '/#nosotros', texto: 'Nosotros', seccion: true },
];

export function Navbar() {
  const auth = useAuth();
  const carrito = useCarrito();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [conScroll, setConScroll] = useState(false);
  const [badgeAnimado, setBadgeAnimado] = useState(false);
  const primeraVez = useRef(true);

  useEffect(() => {
    const alScroll = () => setConScroll(window.scrollY > 20);
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    setBadgeAnimado(true);
    const id = setTimeout(() => setBadgeAnimado(false), 400);
    return () => clearTimeout(id);
  }, [carrito.cantidadTotal]);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname, location.hash]);

  const cerrado = () => setMenuAbierto(false);

  const enlaceActivo = (to: string, seccion: boolean) => {
    if (seccion) {
      const hash = to.split('#')[1];
      return location.pathname === '/' && location.hash === `#${hash}` ? 'active' : undefined;
    }
    return location.pathname.startsWith('/productos') ? 'active' : undefined;
  };

  return (
    <header className={`header${conScroll ? ' scrolled' : ''}`}>
      <nav className="nav container">
        <Link to="/" className="logo" onClick={cerrado}>
          <img src="/imagenes/logo.png" alt="Logo DancyPet" className="logo__icon" />
          <span className="logo__text">
            Dancy<em>Pet</em>
          </span>
        </Link>

        <ul className={`nav__links${menuAbierto ? ' open' : ''}`}>
          {enlaces.map((e) => (
            <li key={e.texto}>
              <Link to={e.to} className={enlaceActivo(e.to, e.seccion)} onClick={cerrado}>
                {e.texto}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav__actions">
          <NavLink className="btn-account" to="/cuenta" onClick={cerrado}>
            <span aria-hidden="true">{auth.autenticado ? '🐱' : '◯'}</span>
            <span>{auth.autenticado ? `Hola, ${auth.primerNombre}` : 'Iniciar sesión'}</span>
          </NavLink>
          <button
            className="btn-cart"
            type="button"
            onClick={() => carrito.setAbierto(true)}
            aria-label="Abrir carrito"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            <span className={`btn-cart__badge${badgeAnimado ? ' bump' : ''}`}>{carrito.cantidadTotal}</span>
          </button>
          <button
            className="nav__toggle"
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
            aria-label="Menú"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
    </header>
  );
}
