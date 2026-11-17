import { Link } from 'react-router-dom';

export function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Link to="/" className="logo">
            <img src="/imagenes/logo.png" alt="" className="logo__icon" />
            <span className="logo__text">
              Dancy<em>Pet</em>
            </span>
          </Link>
          <p>Tienda 100% felina. Todo para tu gato, sólo para tu gato.</p>
        </div>
        <div className="footer__col">
          <h4>Tienda</h4>
          <ul>
            <li>
              <Link to="/productos">Productos</Link>
            </li>
            <li>
              <Link to="/#categorias">Necesidades felinas</Link>
            </li>
            <li>
              <Link to="/cuenta/mascotas">Perfil de mi gato</Link>
            </li>
          </ul>
        </div>
        <div className="footer__col">
          <h4>Ayuda</h4>
          <ul>
            <li>
              <Link to="/cuenta">Mi cuenta</Link>
            </li>
            <li>Envíos en 24-48 h</li>
            <li>Devoluciones en 30 días</li>
          </ul>
        </div>
        <div className="footer__col">
          <h4>Contacto</h4>
          <ul>
            <li>📍 Av. Ayacucho Mz. 9 lote 1A, Tablada Nueva</li>
            <li>📞 +51 930 401 998</li>
            <li>✉️ hola@pawville.pe</li>
          </ul>
        </div>
      </div>
      <div className="footer__stack container">
        <span className="badge text-bg-primary">React + TSX</span>
        <span className="badge text-bg-success">Bootstrap 5</span>
        <span className="badge text-bg-info">Fetch API</span>
        <span className="badge text-bg-warning text-dark">Axios</span>
        <span className="badge text-bg-dark">Alova</span>
        <span className="badge text-bg-secondary">Hooks</span>
      </div>
      <div className="footer__bottom container">
        <p>&copy; {anio} DancyPet. Todos los derechos reservados.</p>
        <div className="footer__social">
          <a href="#" aria-label="Facebook">
            FB
          </a>
          <a href="#" aria-label="Instagram">
            IG
          </a>
          <a href="#" aria-label="TikTok">
            TK
          </a>
        </div>
      </div>
    </footer>
  );
}
