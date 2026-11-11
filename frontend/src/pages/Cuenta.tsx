import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../api/client';
import { listarPedidos } from '../api/pedidos';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { MetodoPago, Pedido } from '../types/pedido';
import { formatearFecha, soles } from '../utils/format';

type Vista = 'login' | 'registro';
type FiltroPedidos = 'todos' | Pedido['tipo'];

const NOMBRES_METODO: Record<MetodoPago, string> = {
  mercadopago: 'Mercado Pago',
  efectivo: 'Contra entrega',
  tarjeta: 'Tarjeta',
  yape: 'Yape / Plin',
};

const ETIQUETAS_FUERZA = ['Muy corta', 'Débil', 'Aceptable', 'Segura'] as const;

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function Cuenta() {
  const auth = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const volver =
    searchParams.get('volver') ||
    (typeof location.state === 'object' && location.state && 'volver' in location.state
      ? String((location.state as { volver?: string }).volver)
      : undefined);

  const [vista, setVista] = useState<Vista>('login');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [bloqMayus, setBloqMayus] = useState(false);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});

  const [login, setLogin] = useState({ email: '', password: '', recordar: true });
  const [registro, setRegistro] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmar: '',
    terminos: false,
  });

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [errorPedidos, setErrorPedidos] = useState('');
  const [filtro, setFiltro] = useState<FiltroPedidos>('todos');

  useEffect(() => {
    document.title = 'Mi cuenta | DancyPet';
  }, []);

  const cargarPedidos = () => {
    setCargandoPedidos(true);
    setErrorPedidos('');
    listarPedidos()
      .then((lista) => {
        setPedidos(lista);
        setCargandoPedidos(false);
      })
      .catch((err) => {
        setCargandoPedidos(false);
        setErrorPedidos(mensajeDeError(err));
      });
  };

  useEffect(() => {
    if (auth.autenticado) cargarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.autenticado, auth.token]);

  const marcar = (campo: string) => setTocados((t) => ({ ...t, [campo]: true }));

  const fuerzaPassword = useMemo(() => {
    const valor = registro.password;
    if (valor.length < 6) return { nivel: 0 as const, etiqueta: ETIQUETAS_FUERZA[0] };
    const criterios = [
      valor.length >= 10,
      /[a-z]/i.test(valor) && /\d/.test(valor),
      (/[A-Z]/.test(valor) && /[a-z]/.test(valor)) || /[^a-z\d]/i.test(valor),
    ].filter(Boolean).length;
    const nivel = Math.min(3, Math.max(1, criterios)) as 1 | 2 | 3;
    return { nivel, etiqueta: ETIQUETAS_FUERZA[nivel] };
  }, [registro.password]);

  const passwordsNoCoinciden = !!registro.confirmar && registro.password !== registro.confirmar;
  const pedidosFiltrados = filtro === 'todos' ? pedidos : pedidos.filter((p) => p.tipo === filtro);
  const totalGastado = pedidos.reduce((a, p) => a + p.total, 0);
  const suscripciones = pedidos.filter((p) => p.tipo === 'suscripcion').length;
  const inicial = auth.usuario?.nombre.charAt(0).toUpperCase() ?? '';

  const cambiarVista = (nueva: Vista) => {
    if (nueva === vista) return;
    if (nueva === 'registro' && !registro.email) setRegistro((r) => ({ ...r, email: login.email }));
    if (nueva === 'login' && !login.email) setLogin((l) => ({ ...l, email: registro.email }));
    setVista(nueva);
    setError('');
    setBloqMayus(false);
  };

  const moverEntrePestanas = (evento: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(evento.key)) return;
    evento.preventDefault();
    const destino: Vista =
      evento.key === 'Home' ? 'login' : evento.key === 'End' ? 'registro' : vista === 'login' ? 'registro' : 'login';
    cambiarVista(destino);
    document.getElementById(`tab-${destino}`)?.focus();
  };

  const detectarBloqMayus = (evento: KeyboardEvent<HTMLInputElement>) => {
    setBloqMayus(evento.getModifierState?.('CapsLock') ?? false);
  };

  const trasAuth = (nombre: string) => {
    setEnviando(false);
    setBloqMayus(false);
    setLogin({ email: '', password: '', recordar: true });
    setRegistro({ nombre: '', email: '', password: '', confirmar: '', terminos: false });
    setTocados({});
    toast.mostrar(`¡Bienvenido, ${nombre.split(' ')[0]}!`);
    if (volver?.startsWith('/') && !volver.startsWith('//')) navigate(volver);
  };

  const iniciarSesion = async (e: FormEvent) => {
    e.preventDefault();
    setTocados({ loginEmail: true, loginPassword: true });
    if (!emailOk(login.email) || !login.password) return;
    setEnviando(true);
    setError('');
    try {
      const { usuario } = await auth.login(login.email.trim(), login.password, login.recordar);
      trasAuth(usuario.nombre);
    } catch (err) {
      setEnviando(false);
      setError(mensajeDeError(err));
    }
  };

  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    setTocados({
      regNombre: true,
      regEmail: true,
      regPassword: true,
      regConfirmar: true,
      regTerminos: true,
    });
    if (
      registro.nombre.trim().length < 3 ||
      !emailOk(registro.email) ||
      registro.password.length < 6 ||
      passwordsNoCoinciden ||
      !registro.terminos
    ) {
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const { usuario } = await auth.registrar({
        nombre: registro.nombre.trim(),
        email: registro.email.trim(),
        password: registro.password,
      });
      trasAuth(usuario.nombre);
    } catch (err) {
      setEnviando(false);
      setError(mensajeDeError(err));
    }
  };

  const cerrarSesion = () => {
    auth.cerrarSesion();
    setPedidos([]);
    setFiltro('todos');
    setVista('login');
    toast.mostrar('Sesión cerrada');
  };

  const descripcion = (pedido: Pedido) => {
    if (pedido.tipo === 'suscripcion') return `Suscripción mensual de ${pedido.mascotaNombre}`;
    const unidades = pedido.items?.reduce((acum, item) => acum + item.cantidad, 0) ?? 0;
    return `${unidades} ${unidades === 1 ? 'producto' : 'productos'}`;
  };

  const metodoPago = (pedido: Pedido) => {
    const nombre = NOMBRES_METODO[pedido.pago.metodo] ?? pedido.pago.metodo;
    return pedido.pago.ultimos4 ? `${nombre} •••• ${pedido.pago.ultimos4}` : nombre;
  };

  if (!auth.autenticado) {
    return (
      <section className="page">
        <div className="container account">
          <div className="account__card">
            <div className="auth-header">
              <span className="section-tag">Mi cuenta</span>
              <h3>{vista === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h3>
              <p>
                {volver
                  ? 'Inicia sesión o crea una cuenta para continuar.'
                  : 'Ingresa para registrar a tu gato, activar su suscripción y ver tus pedidos.'}
              </p>
            </div>
            <div
              className="auth-tabs"
              role="tablist"
              aria-label="Acceso a la cuenta"
              onKeyDown={moverEntrePestanas}
            >
              <button
                id="tab-login"
                className={`auth-tab${vista === 'login' ? ' active' : ''}`}
                type="button"
                role="tab"
                aria-controls="panel-login"
                aria-selected={vista === 'login'}
                tabIndex={vista === 'login' ? 0 : -1}
                onClick={() => cambiarVista('login')}
              >
                Iniciar sesión
              </button>
              <button
                id="tab-registro"
                className={`auth-tab${vista === 'registro' ? ' active' : ''}`}
                type="button"
                role="tab"
                aria-controls="panel-registro"
                aria-selected={vista === 'registro'}
                tabIndex={vista === 'registro' ? 0 : -1}
                onClick={() => cambiarVista('registro')}
              >
                Crear cuenta
              </button>
            </div>

            {vista === 'login' && (
              <form
                id="panel-login"
                className="auth-form"
                role="tabpanel"
                aria-labelledby="tab-login"
                onSubmit={iniciarSesion}
                noValidate
              >
                <div className="form-group">
                  <label htmlFor="loginEmail">Correo electrónico</label>
                  <input
                    id="loginEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={login.email}
                    onChange={(e) => setLogin({ ...login, email: e.target.value })}
                    onBlur={() => marcar('loginEmail')}
                    className={tocados.loginEmail && !emailOk(login.email) ? 'is-invalid' : undefined}
                  />
                  {tocados.loginEmail && !emailOk(login.email) && (
                    <small className="field-error">Ingresa un correo válido.</small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="loginPassword">Contraseña</label>
                  <div className="password-field">
                    <input
                      id="loginPassword"
                      type={verPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={login.password}
                      onChange={(e) => setLogin({ ...login, password: e.target.value })}
                      onBlur={() => {
                        marcar('loginPassword');
                        setBloqMayus(false);
                      }}
                      onKeyUp={detectarBloqMayus}
                      className={tocados.loginPassword && !login.password ? 'is-invalid' : undefined}
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      aria-pressed={verPassword}
                      aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setVerPassword((v) => !v)}
                    >
                      {verPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  {tocados.loginPassword && !login.password && (
                    <small className="field-error">Ingresa tu contraseña.</small>
                  )}
                  {bloqMayus && (
                    <small className="field-hint field-hint--warning" role="status">
                      ⇪ Bloq Mayús está activado.
                    </small>
                  )}
                </div>
                <div className="auth-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={login.recordar}
                      onChange={(e) => setLogin({ ...login, recordar: e.target.checked })}
                    />{' '}
                    Recordarme en este equipo
                  </label>
                </div>
                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="btn btn--primary btn--full btn--lg" type="submit" disabled={enviando}>
                  {enviando ? 'Ingresando...' : 'Iniciar sesión'}
                </button>
                <p className="auth-switch">
                  ¿Aún no tienes cuenta?{' '}
                  <button className="auth-link" type="button" onClick={() => cambiarVista('registro')}>
                    Créala gratis
                  </button>
                </p>
              </form>
            )}

            {vista === 'registro' && (
              <form
                id="panel-registro"
                className="auth-form"
                role="tabpanel"
                aria-labelledby="tab-registro"
                onSubmit={registrar}
                noValidate
              >
                <div className="form-group">
                  <label htmlFor="registerName">Nombre completo</label>
                  <input
                    id="registerName"
                    autoComplete="name"
                    value={registro.nombre}
                    onChange={(e) => setRegistro({ ...registro, nombre: e.target.value })}
                    onBlur={() => marcar('regNombre')}
                    className={tocados.regNombre && registro.nombre.trim().length < 3 ? 'is-invalid' : undefined}
                  />
                  {tocados.regNombre && registro.nombre.trim().length < 3 && (
                    <small className="field-error">Mínimo 3 caracteres.</small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="registerEmail">Correo electrónico</label>
                  <input
                    id="registerEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={registro.email}
                    onChange={(e) => setRegistro({ ...registro, email: e.target.value })}
                    onBlur={() => marcar('regEmail')}
                    className={tocados.regEmail && !emailOk(registro.email) ? 'is-invalid' : undefined}
                  />
                  {tocados.regEmail && !emailOk(registro.email) && (
                    <small className="field-error">Ingresa un correo válido.</small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="registerPassword">Contraseña</label>
                  <div className="password-field">
                    <input
                      id="registerPassword"
                      type={verPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      aria-describedby="passwordStrength"
                      value={registro.password}
                      onChange={(e) => setRegistro({ ...registro, password: e.target.value })}
                      onBlur={() => {
                        marcar('regPassword');
                        setBloqMayus(false);
                      }}
                      onKeyUp={detectarBloqMayus}
                      className={tocados.regPassword && registro.password.length < 6 ? 'is-invalid' : undefined}
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      aria-pressed={verPassword}
                      aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setVerPassword((v) => !v)}
                    >
                      {verPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  {registro.password && (
                    <div id="passwordStrength" className="password-strength" data-nivel={fuerzaPassword.nivel} aria-live="polite">
                      <div className="password-strength__bar" aria-hidden="true">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className={i < fuerzaPassword.nivel ? 'on' : undefined}></span>
                        ))}
                      </div>
                      <small>Seguridad: {fuerzaPassword.etiqueta}</small>
                    </div>
                  )}
                  {tocados.regPassword && registro.password.length < 6 && (
                    <small className="field-error">Mínimo 6 caracteres.</small>
                  )}
                  {bloqMayus && (
                    <small className="field-hint field-hint--warning" role="status">
                      ⇪ Bloq Mayús está activado.
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="registerPasswordConfirm">Repetir contraseña</label>
                  <input
                    id="registerPasswordConfirm"
                    type={verPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={registro.confirmar}
                    onChange={(e) => setRegistro({ ...registro, confirmar: e.target.value })}
                    onBlur={() => marcar('regConfirmar')}
                    className={
                      (tocados.regConfirmar && !registro.confirmar) ||
                      (passwordsNoCoinciden && tocados.regConfirmar)
                        ? 'is-invalid'
                        : undefined
                    }
                  />
                  {tocados.regConfirmar && !registro.confirmar && (
                    <small className="field-error">Repite tu contraseña.</small>
                  )}
                  {passwordsNoCoinciden && tocados.regConfirmar && (
                    <small className="field-error">Las contraseñas no coinciden.</small>
                  )}
                </div>
                <label className="checkbox-label auth-terms">
                  <input
                    type="checkbox"
                    checked={registro.terminos}
                    onChange={(e) => setRegistro({ ...registro, terminos: e.target.checked })}
                    onBlur={() => marcar('regTerminos')}
                  />{' '}
                  Acepto los términos y condiciones.
                </label>
                {tocados.regTerminos && !registro.terminos && (
                  <small className="field-error">Debes aceptar los términos.</small>
                )}
                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="btn btn--primary btn--full btn--lg" type="submit" disabled={enviando}>
                  {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
                <p className="auth-switch">
                  ¿Ya tienes cuenta?{' '}
                  <button className="auth-link" type="button" onClick={() => cambiarVista('login')}>
                    Inicia sesión
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    );
  }

  const filtros: { valor: FiltroPedidos; etiqueta: string }[] = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'compra', etiqueta: 'Compras' },
    { valor: 'suscripcion', etiqueta: 'Suscripciones' },
  ];

  return (
    <section className="page">
      <div className="container account">
        <div className="account__card account__profile">
          <div className="account__profile-head">
            <div className="auth-session-avatar" aria-hidden="true">
              {inicial}
            </div>
            <div>
              <h3>Hola, {auth.usuario?.nombre}</h3>
              <p>
                {auth.usuario?.email}
                {auth.usuario?.creadoEn && <> · Cliente desde {formatearFecha(auth.usuario.creadoEn, 'mes-anio')}</>}
              </p>
            </div>
          </div>
          <dl className="account-stats" aria-busy={cargandoPedidos}>
            <div className="account-stats__item">
              <dt>Pedidos</dt>
              <dd>{cargandoPedidos ? '—' : pedidos.length}</dd>
            </div>
            <div className="account-stats__item">
              <dt>Total pagado</dt>
              <dd>{cargandoPedidos ? '—' : soles(totalGastado)}</dd>
            </div>
            <div className="account-stats__item">
              <dt>Suscripciones</dt>
              <dd>{cargandoPedidos ? '—' : suscripciones}</dd>
            </div>
          </dl>
          <div className="account__actions">
            <Link className="btn btn--primary" to="/cuenta/mascotas">
              🐱 Mis gatos
            </Link>
            <Link className="btn btn--outline" to="/productos">
              Seguir comprando
            </Link>
          </div>
          <button className="btn btn--ghost btn--full" type="button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>

        <div className="account__card account__orders">
          <div className="account__orders-head">
            <h3>Mis pedidos</h3>
            {pedidos.length > 0 && (
              <div className="order-filters" role="group" aria-label="Filtrar pedidos">
                {filtros.map((f) => (
                  <button
                    key={f.valor}
                    className={`order-filter${filtro === f.valor ? ' active' : ''}`}
                    type="button"
                    aria-pressed={filtro === f.valor}
                    onClick={() => setFiltro(f.valor)}
                  >
                    {f.etiqueta}
                  </button>
                ))}
              </div>
            )}
          </div>

          {cargandoPedidos && (
            <div aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div className="order-skeleton" key={i}>
                  <span className="skeleton__line"></span>
                  <span className="skeleton__line skeleton__line--short"></span>
                </div>
              ))}
            </div>
          )}

          {!cargandoPedidos && errorPedidos && (
            <div className="auth-error account__orders-error" role="alert">
              <span>No pudimos cargar tus pedidos: {errorPedidos}</span>
              <button className="auth-link" type="button" onClick={cargarPedidos}>
                Reintentar
              </button>
            </div>
          )}

          {!cargandoPedidos && !errorPedidos && (
            <>
              {!pedidos.length && (
                <p className="pets-empty">
                  Aún no tienes pedidos. <Link to="/productos">Explora el catálogo</Link>.
                </p>
              )}
              {pedidos.length > 0 && !pedidosFiltrados.length && (
                <p className="pets-empty">No tienes pedidos de este tipo.</p>
              )}
              {pedidosFiltrados.map((p) => (
                <details className="order-row" key={p.id}>
                  <summary className="order-row__summary">
                    <div className="order-row__info">
                      <strong>
                        N° {p.numero}{' '}
                        <span className={`order-badge${p.tipo === 'suscripcion' ? ' order-badge--sub' : ''}`}>
                          {p.tipo === 'suscripcion' ? 'Suscripción' : 'Compra'}
                        </span>
                        {p.estado === 'pendiente' && (
                          <span className="order-badge order-badge--pendiente">Pendiente</span>
                        )}
                      </strong>
                      <small>
                        {formatearFecha(p.fecha)} · {descripcion(p)}
                      </small>
                    </div>
                    <span className="order-row__total">{soles(p.total)}</span>
                  </summary>
                  <div className="order-row__detail">
                    {!!p.items?.length && (
                      <ul className="order-lines">
                        {p.items.map((item) => (
                          <li key={item.productoId}>
                            <span>
                              {item.cantidad} × {item.nombre}
                            </span>
                            <span>{soles(item.precio * item.cantidad)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {p.entrega && (
                      <p className="order-delivery">
                        📍 {p.entrega.direccion} · 🕒 {p.entrega.horario}
                      </p>
                    )}
                    <dl className="order-totals">
                      {p.igv > 0 && (
                        <>
                          <div>
                            <dt>Subtotal</dt>
                            <dd>{soles(p.subtotal)}</dd>
                          </div>
                          <div>
                            <dt>IGV (18%)</dt>
                            <dd>{soles(p.igv)}</dd>
                          </div>
                        </>
                      )}
                      <div>
                        <dt>Pagado con</dt>
                        <dd>{metodoPago(p)}</dd>
                      </div>
                      <div className="order-totals__total">
                        <dt>Total</dt>
                        <dd>{soles(p.total)}</dd>
                      </div>
                    </dl>
                  </div>
                </details>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
