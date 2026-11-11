import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { listarCategorias, listarProductos } from '../api/productos';
import { ProductoCard } from '../components/ProductoCard';
import { useToast } from '../context/ToastContext';
import type { Categoria, Producto } from '../types/producto';
import { usarImagenRespaldo } from '../utils/imagen';

const razones = [
  {
    icono: '🐱',
    titulo: 'Pensado para tu gato',
    texto: 'Encuentra productos para sus necesidades, sin perderte entre opciones para otras mascotas.',
  },
  {
    icono: '📖',
    titulo: 'Elige con confianza',
    texto: 'Resuelve tus dudas con información práctica para tomar mejores decisiones sobre su cuidado.',
  },
  {
    icono: '🛍️',
    titulo: 'Cuida más, busca menos',
    texto: 'Alimentos, arenas, juguetes y accesorios para tu gato en un solo lugar.',
  },
];

const guias = [
  {
    fecha: 'Guía de cuidado',
    titulo: '¿Por qué mi gato maúlla tanto?',
    texto:
      'Son las tres de la mañana y tu gato maúlla frente a la puerta. A veces te sigue por toda la casa conversando sin parar.',
    imagen: 'https://images.unsplash.com/photo-1495360010543-ea998f57b0be?w=600&h=360&fit=crop',
  },
  {
    fecha: 'Salud felina',
    titulo: 'Calendario de vacunas para gatos',
    texto:
      'Acabas de recibir a tu primer gato y, entre tanta ternura, aparece una pregunta importante: ¿cuándo hay que vacunarlo?',
    imagen: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=600&h=360&fit=crop',
  },
  {
    fecha: 'Antes de adoptar',
    titulo: '¿Estoy listo para tener un gato?',
    texto:
      'Adoptar un gato es una de las decisiones más bonitas que puedes tomar. También es una de las más importantes.',
    imagen: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&h=360&fit=crop',
  },
];

const beneficios = [
  { icono: '🚚', titulo: 'Envío rápido', texto: 'Entrega en 24-48 horas en Lima Metropolitana' },
  { icono: '🔒', titulo: 'Pago seguro', texto: 'Transacciones protegidas con Mercado Pago' },
  { icono: '↩️', titulo: 'Devoluciones', texto: '30 días para devolver si no estás satisfecho' },
  { icono: '💬', titulo: 'Soporte felino', texto: 'Asesoría para el cuidado diario de tu gato' },
];

export function Inicio() {
  const toast = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [destacados, setDestacados] = useState<Producto[]>([]);
  const [error, setError] = useState(false);
  const [correo, setCorreo] = useState('');
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    document.title = 'DancyPet — Todo para tu gato';
    Promise.all([listarCategorias(), listarProductos()])
      .then(([cats, productos]) => {
        setCategorias(cats);
        setDestacados(productos.filter((p) => p.badge && p.disponible).slice(0, 4));
      })
      .catch(() => setError(true));
  }, []);

  const nombreCategoria = (clave: string) => categorias.find((c) => c.clave === clave)?.nombre ?? clave;

  const suscribirNewsletter = (e: FormEvent) => {
    e.preventDefault();
    setTocado(true);
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return;
    toast.mostrar('🎉 ¡Gracias por suscribirte! Revisa tu correo.');
    setCorreo('');
    setTocado(false);
  };

  const emailInvalido = tocado && (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo));

  return (
    <>
      <section className="hero" id="inicio">
        <div className="hero__bg">
          <div className="hero__blob hero__blob--1"></div>
          <div className="hero__blob hero__blob--2"></div>
          <div className="hero__blob hero__blob--3"></div>
        </div>
        <div className="container hero__content">
          <div className="hero__text">
            <span className="hero__tag">Tienda 100% felina</span>
            <h1>
              Todo para tu <span className="text-gradient">gato</span>.
              <br />
              Sólo para tu gato.
            </h1>
            <p>Productos seleccionados pensando en su bienestar y en todo lo que hace especial la vida con tu gato.</p>
            <div className="hero__cta">
              <Link to="/productos" className="btn btn--primary btn--lg">
                Ver toda la tienda
              </Link>
              <Link to="/#categorias" className="btn btn--outline btn--lg">
                Explorar categorías
              </Link>
            </div>
            <div className="hero__stats">
              <div className="stat">
                <strong>4</strong>
                <span>Necesidades felinas</span>
              </div>
              <div className="stat">
                <strong>16</strong>
                <span>Productos curados</span>
              </div>
              <div className="stat">
                <strong>4.9★</strong>
                <span>Valoración</span>
              </div>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=700&fit=crop"
                alt="Gato naranja descansando"
                className="hero__image"
                onError={usarImagenRespaldo}
              />
              <div className="hero__float-card hero__float-card--1">
                <span>🧶</span>
                <div>
                  <strong>Torre rascadora</strong>
                  <small>Desde S/ 229.90</small>
                </div>
              </div>
              <div className="hero__float-card hero__float-card--2">
                <span>🐱</span>
                <div>
                  <strong>+2,400 vendidos</strong>
                  <small>Alimento para gato</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="needs" id="categorias">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Soluciones felinas</span>
            <h2>Soluciones por necesidad felina</h2>
            <p>Cada categoría existe para resolver algo real en su día a día</p>
          </div>
          {error && (
            <div className="alert alert--error">
              No se pudo conectar con la API. Ejecuta <code>npm run api</code> para iniciar el backend.
            </div>
          )}
          <div className="needs__grid">
            <div className="needs__photo">
              <img
                src="https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=1100&fit=crop"
                alt="Gato atigrado sentado"
                onError={usarImagenRespaldo}
              />
            </div>
            {categorias.map((c) => (
              <Link
                key={c.clave}
                className={`need-card need-card--${c.clave}`}
                to={`/productos?categoria=${c.clave}`}
              >
                <div>
                  <span className="need-card__icon">{c.icono}</span>
                  <h3>{c.nombre}</h3>
                  <p>{c.subtitulo}</p>
                </div>
                <span className="need-card__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="products">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Selección DancyPet</span>
              <h2>Elegidos para tu gato</h2>
              <p>Alimentos, higiene, juego y hogar. Solo lo que un gato realmente usa.</p>
            </div>
            <div className="products__grid">
              {destacados.map((p) => (
                <ProductoCard key={p.id} producto={p} categoria={nombreCategoria(p.categoria)} />
              ))}
            </div>
            <div className="products__more">
              <Link to="/productos" className="btn btn--outline">
                Ver todos los productos →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="reasons" id="nosotros">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">¿Por qué DancyPet?</span>
            <h2>Entender mejor a tu gato cambia la forma de cuidarlo</h2>
            <p>
              Sabemos que quieres verlo sano, activo y feliz. Por eso encontrarás productos para sus necesidades e
              información práctica que te ayuda a cuidarlo mejor.
            </p>
          </div>
          <div className="reasons__grid">
            {razones.map((r) => (
              <article className="reason-card" key={r.titulo}>
                <div className="reason-card__icon">{r.icono}</div>
                <h3>{r.titulo}</h3>
                <p>{r.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="guides" id="guias">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Guías</span>
            <h2>Preguntas que aparecen cuando vives con un gato</h2>
            <p>Información práctica para entender mejor sus necesidades y tomar mejores decisiones.</p>
          </div>
          <div className="guides__grid">
            {guias.map((g) => (
              <article className="guide-card" key={g.titulo}>
                <img src={g.imagen} alt={g.titulo} onError={usarImagenRespaldo} />
                <div className="guide-card__body">
                  <small>{g.fecha}</small>
                  <h3>{g.titulo}</h3>
                  <p>{g.texto}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="meet-cat">
        <div className="container meet-cat__inner">
          <div className="meet-cat__text">
            <span className="section-tag">Perfil felino</span>
            <h2>Queremos conocer a tu gato</h2>
            <p>Porque cada gato es diferente, empieza contándonos un poco sobre el tuyo.</p>
            <p>
              Crea su perfil en DancyPet y registra sus características. Será el comienzo de una experiencia pensada
              alrededor de él, incluida su suscripción mensual de alimento.
            </p>
            <Link
              to="/cuenta/mascotas"
              className="btn btn--primary btn--lg"
              style={{ transition: 'transform .3s, box-shadow .3s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              Crear el perfil de mi gato
            </Link>
          </div>
          <div className="meet-cat__image">
            <img
              src="https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=700&h=560&fit=crop"
              alt="Persona abrazando a su gato"
              onError={usarImagenRespaldo}
            />
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="container benefits__grid">
          {beneficios.map((b) => (
            <div className="benefit-card" key={b.titulo}>
              <div className="benefit-card__icon">{b.icono}</div>
              <h3>{b.titulo}</h3>
              <p>{b.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="newsletter">
        <div className="container newsletter__inner">
          <div className="newsletter__text">
            <h2>15% de descuento en tu primera compra</h2>
            <p>Recibe consejos de cuidado felino y ofertas solo para gatos</p>
          </div>
          <form className="newsletter__form" onSubmit={suscribirNewsletter} noValidate>
            <input
              type="email"
              name="email"
              placeholder="tu@email.com"
              aria-label="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={emailInvalido ? 'is-invalid' : undefined}
            />
            <button type="submit" className="btn btn--primary">
              Suscribirme
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
