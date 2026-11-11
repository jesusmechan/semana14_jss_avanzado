import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../api/client';
import * as pedidosApi from '../api/pedidos';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { useMascotaPendiente, type SuscripcionPendiente } from '../context/MascotaContext';
import type { MetodoPago, PagoEfectivo, Pedido } from '../types/pedido';
import type { MpBrickController, MpFormData } from '../types/mercadopago';
import { soles, soloDigitos } from '../utils/format';

const TELEFONO = /^9\d{8}$/;
const CONTENEDOR_BRICK = 'mpPaymentBrick';
const CORREO_PAGADOR_PRUEBA = 'comprador.dancypet@gmail.com';

const metodos: { valor: MetodoPago; icono: string; texto: string }[] = [
  { valor: 'mercadopago', icono: '💳', texto: 'Mercado Pago' },
  { valor: 'efectivo', icono: '💵', texto: 'Contra entrega' },
];

function cargarSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existente = document.querySelector<HTMLScriptElement>('script[src="https://sdk.mercadopago.com/js/v2"]');
    if (existente) {
      existente.addEventListener('load', () => resolve());
      existente.addEventListener('error', () => reject(new Error('No se pudo cargar Mercado Pago')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Mercado Pago'));
    document.head.appendChild(script);
  });
}

export function Pago() {
  const carrito = useCarrito();
  const auth = useAuth();
  const { pendiente: pendienteCtx, setPendiente } = useMascotaPendiente();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const suscripcionId = searchParams.get('suscripcion');

  const [pendiente, setPendienteLocal] = useState<SuscripcionPendiente | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>('mercadopago');
  const [efectivo, setEfectivo] = useState<PagoEfectivo>({
    metodo: 'efectivo',
    nombre: '',
    telefono: '',
    direccion: '',
  });
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [confirmado, setConfirmado] = useState<Pedido | null>(null);

  const brickRef = useRef<MpBrickController | null>(null);
  const brickGen = useRef(0);
  const clavePublica = useRef('');
  const procesandoRef = useRef(false);
  const pendienteRef = useRef(pendiente);
  const carritoItemsRef = useRef(carrito.items);

  useEffect(() => {
    pendienteRef.current = pendiente;
  }, [pendiente]);

  useEffect(() => {
    carritoItemsRef.current = carrito.items;
  }, [carrito.items]);

  const esSuscripcion = pendiente !== null;
  const usaMercadoPago = esSuscripcion || metodo === 'mercadopago';
  const listoParaPagar = esSuscripcion || !carrito.estaVacio;
  const total = pendiente?.mascota.suscripcion.precioMensualFinal ?? carrito.total;

  useEffect(() => {
    document.title = 'Pago | DancyPet';
    if (auth.usuario) {
      setEfectivo((e) => ({ ...e, nombre: e.nombre || auth.usuario!.nombre }));
    }
    if (suscripcionId) {
      if (!pendienteCtx || pendienteCtx.mascota.id !== +suscripcionId) {
        navigate('/cuenta/mascotas');
        return;
      }
      setPendienteLocal(pendienteCtx);
    }
  }, [suscripcionId, pendienteCtx, navigate, auth.usuario]);

  const desmontarBrick = () => {
    brickGen.current += 1;
    brickRef.current?.unmount();
    brickRef.current = null;
  };

  const confirmar = (pedido: Pedido) => {
    setConfirmado(pedido);
    setProcesando(false);
    procesandoRef.current = false;
    desmontarBrick();
    if (pendienteRef.current) setPendiente(null);
    else carrito.vaciar();
  };

  const enviarMercadoPago = (formData: MpFormData): Promise<void> =>
    new Promise((resolve, reject) => {
      if (procesandoRef.current) {
        reject();
        return;
      }
      procesandoRef.current = true;
      setProcesando(true);
      setError('');
      const pago = {
        metodo: 'mercadopago' as const,
        ...formData,
        payer: { ...formData.payer, email: CORREO_PAGADOR_PRUEBA },
      };
      const peticion = pendienteRef.current
        ? pedidosApi.suscribir(pendienteRef.current.mascota.id, pendienteRef.current.entrega, pago)
        : pedidosApi.comprar(carritoItemsRef.current, pago);

      peticion
        .then((pedido) => {
          confirmar(pedido);
          resolve();
        })
        .catch((err) => {
          setError(mensajeDeError(err, 'No se pudo procesar el pago.'));
          setProcesando(false);
          procesandoRef.current = false;
          reject();
        });
    });

  const montarBrick = async () => {
    const gen = ++brickGen.current;
    brickRef.current?.unmount();
    brickRef.current = null;

    try {
      await cargarSdk();
      if (!clavePublica.current) {
        const cfg = await pedidosApi.configPagos();
        clavePublica.current = cfg.publicKey;
      }

      // Esperar a que el contenedor exista en el DOM
      await new Promise<void>((resolve, reject) => {
        let intentos = 0;
        const id = setInterval(() => {
          if (document.getElementById(CONTENEDOR_BRICK)) {
            clearInterval(id);
            resolve();
          } else if (++intentos > 50) {
            clearInterval(id);
            reject(new Error('No se encontró el formulario de pago.'));
          }
        }, 20);
      });

      if (gen !== brickGen.current) return;

      const amount = pendienteRef.current?.mascota.suscripcion.precioMensualFinal ?? carrito.total;
      const mp = new window.MercadoPago(clavePublica.current, { locale: 'es-PE' });
      const controller = await mp.bricks().create('payment', CONTENEDOR_BRICK, {
        initialization: {
          amount,
          payer: { email: CORREO_PAGADOR_PRUEBA },
        },
        customization: {
          paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            maxInstallments: 1,
          },
        },
        callbacks: {
          onReady: () => {},
          onError: (err: { message?: string }) => {
            setError(err?.message || 'No se pudo cargar el formulario de Mercado Pago.');
          },
          onSubmit: ({ formData }: { formData: MpFormData }) => enviarMercadoPago(formData),
        },
      });

      if (gen !== brickGen.current) {
        controller.unmount();
        return;
      }
      brickRef.current = controller;
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo iniciar Mercado Pago. Revisa las credenciales de prueba.'));
    }
  };

  useEffect(() => {
    if (confirmado) return;
    if (usaMercadoPago && listoParaPagar) {
      void montarBrick();
    } else {
      desmontarBrick();
    }
    return () => desmontarBrick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usaMercadoPago, listoParaPagar, pendiente, confirmado]);

  const elegirMetodo = (valor: MetodoPago) => {
    if (metodo === valor || procesando) return;
    setMetodo(valor);
    setError('');
  };

  const validarEfectivo = (): string => {
    if (efectivo.nombre.trim().length < 3) return 'Ingresa tu nombre completo.';
    if (!TELEFONO.test(efectivo.telefono)) return 'Ingresa un teléfono válido (9 dígitos, empieza con 9).';
    if (efectivo.direccion.trim().length < 10) return 'Ingresa una dirección de entrega válida.';
    return '';
  };

  const pagarEfectivo = async (e: FormEvent) => {
    e.preventDefault();
    const msg = validarEfectivo();
    setError(msg);
    if (msg || procesando) return;
    setProcesando(true);
    try {
      const pedido = await pedidosApi.comprar(carrito.items, efectivo);
      confirmar(pedido);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo registrar el pedido.'));
      setProcesando(false);
    }
  };

  const continuar = () => {
    navigate(confirmado?.tipo === 'suscripcion' ? '/cuenta/mascotas' : '/productos');
  };

  return (
    <>
      <section className="page">
        <div className="container">
          {!confirmado && (
            <>
              {!esSuscripcion && carrito.estaVacio ? (
                <div className="checkout-empty">
                  <span className="cart-empty-icon">🛒</span>
                  <h2>Tu carrito está vacío</h2>
                  <p>Agrega productos antes de finalizar la compra.</p>
                  <Link to="/productos" className="btn btn--primary">
                    Ver productos
                  </Link>
                </div>
              ) : (
                <div className="checkout">
                  <div className="checkout__card">
                    <div className="payment-header">
                      <span className="section-tag">Pago seguro</span>
                      <h3>{esSuscripcion ? 'Activa tu suscripción mensual' : 'Completa tu compra'}</h3>
                      <p className="payment-total">
                        {esSuscripcion ? 'Cargo mensual: ' : 'Total a pagar: '}
                        <strong>{soles(total)}</strong>
                      </p>
                    </div>

                    {!esSuscripcion && (
                      <div className="payment-methods payment-methods--dos">
                        {metodos.map((m) => (
                          <button
                            key={m.valor}
                            type="button"
                            className={`payment-method${metodo === m.valor ? ' active' : ''}`}
                            disabled={procesando}
                            onClick={() => elegirMetodo(m.valor)}
                          >
                            <span>{m.icono}</span> {m.texto}
                          </button>
                        ))}
                      </div>
                    )}

                    {usaMercadoPago && (
                      <>
                        <p className="payment-hint">
                          Entorno de prueba. Deja el correo <strong>comprador.dancypet@gmail.com</strong> (no uses el
                          de tu cuenta de Mercado Pago). Tarjeta: <strong>5031 7557 3453 0604</strong>, vence{' '}
                          <strong>11/30</strong>, CVV <strong>123</strong>, titular <strong>APRO</strong>, DNI{' '}
                          <strong>12345678</strong>.
                        </p>
                        <div id={CONTENEDOR_BRICK} className="mp-brick"></div>
                        {procesando && <p className="payment-hint">Procesando el pago con Mercado Pago…</p>}
                      </>
                    )}

                    {!esSuscripcion && metodo === 'efectivo' && (
                      <form className="payment-form" onSubmit={pagarEfectivo} noValidate>
                        <div className="payment-alt">
                          <div className="payment-alt__icon">🚚</div>
                          <p>Paga en efectivo cuando recibas tu pedido en la puerta de tu casa.</p>
                        </div>
                        <div className="form-group">
                          <label htmlFor="cashName">Nombre completo</label>
                          <input
                            id="cashName"
                            placeholder="Juan Pérez"
                            value={efectivo.nombre}
                            onChange={(e) => setEfectivo({ ...efectivo, nombre: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cashPhone">Teléfono de contacto</label>
                          <input
                            id="cashPhone"
                            type="tel"
                            inputMode="numeric"
                            placeholder="987654321"
                            value={efectivo.telefono}
                            onChange={(e) =>
                              setEfectivo({ ...efectivo, telefono: soloDigitos(e.target.value, 9) })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cashAddress">Dirección de entrega</label>
                          <textarea
                            id="cashAddress"
                            rows={2}
                            placeholder="Av. Ejemplo 123, Lima"
                            value={efectivo.direccion}
                            onChange={(e) => setEfectivo({ ...efectivo, direccion: e.target.value })}
                          />
                        </div>
                        <button className="btn btn--primary btn--full btn--lg" type="submit" disabled={procesando}>
                          {procesando ? 'Registrando...' : 'Confirmar pedido'}
                        </button>
                      </form>
                    )}

                    {error && (
                      <p className="auth-error" role="alert">
                        {error}
                      </p>
                    )}
                    <p className="payment-secure">
                      🔒 El número de tarjeta y el CVV los procesa Mercado Pago. DancyPet no los almacena.
                    </p>
                  </div>

                  <aside className="checkout__summary">
                    <h3>Resumen</h3>
                    {pendiente ? (
                      <>
                        <div className="summary-pet">
                          <span className="pet-card__avatar">
                            {pendiente.mascota.foto ? (
                              <img src={pendiente.mascota.foto} alt={pendiente.mascota.nombre} />
                            ) : (
                              pendiente.mascota.icono
                            )}
                          </span>
                          <div>
                            <strong>Suscripción de {pendiente.mascota.nombre}</strong>
                            <small>{pendiente.mascota.suscripcion.kgMensuales} kg de comida al mes</small>
                          </div>
                        </div>
                        <div className="cart-summary">
                          <span>Comida</span>
                          <span>{soles(pendiente.mascota.suscripcion.costoComida)}</span>
                        </div>
                        <div className="cart-summary">
                          <span>Premios</span>
                          <span>{soles(pendiente.mascota.suscripcion.costoPremios)}</span>
                        </div>
                        <div className="cart-summary">
                          <span>Entregas semanales</span>
                          <span>{soles(pendiente.mascota.suscripcion.costoEnvios)}</span>
                        </div>
                        <div className="cart-summary">
                          <span>Descuento suscripción</span>
                          <span>− {soles(pendiente.mascota.suscripcion.descuentoSuscripcion)}</span>
                        </div>
                        <div className="cart-summary cart-summary--total">
                          <span>Total mensual</span>
                          <span>{soles(total)}</span>
                        </div>
                        <p className="summary-note">
                          📍 {pendiente.entrega.direccion}
                          <br />🕒 {pendiente.entrega.horario}
                        </p>
                      </>
                    ) : (
                      <>
                        {carrito.items.map((item) => (
                          <div className="summary-item" key={item.producto.id}>
                            <span>
                              {item.cantidad} × {item.producto.nombre}
                            </span>
                            <span>{soles(item.producto.precio * item.cantidad)}</span>
                          </div>
                        ))}
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
                      </>
                    )}
                  </aside>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {confirmado && (
        <div className="modal">
          <div className="modal__backdrop"></div>
          <div className="modal__content" role="dialog" aria-modal="true" aria-labelledby="tituloConfirmacion">
            <div className="modal__icon">{confirmado.estado === 'pendiente' ? '📦' : '✅'}</div>
            <h3 id="tituloConfirmacion">
              {confirmado.tipo === 'suscripcion'
                ? '¡Suscripción activa!'
                : confirmado.estado === 'pendiente'
                  ? '¡Pedido registrado!'
                  : '¡Compra realizada!'}
            </h3>
            {confirmado.tipo === 'suscripcion' ? (
              <p>
                La suscripción de {confirmado.mascotaNombre} quedó activa. El cargo mensual es de{' '}
                {soles(confirmado.total)}
                {confirmado.pago.ultimos4 && <> con la tarjeta terminada en {confirmado.pago.ultimos4}</>}.
              </p>
            ) : confirmado.estado === 'pendiente' ? (
              <p>Pagarás en efectivo al recibir el pedido. Te contactaremos al número que registraste.</p>
            ) : (
              <p>Tu pago con Mercado Pago fue aprobado. Tu pedido está en camino.</p>
            )}
            <p className="checkout-order">
              Pedido N° {confirmado.numero} — Total: {soles(confirmado.total)}
            </p>
            <button className="btn btn--primary" type="button" onClick={continuar}>
              {confirmado.tipo === 'suscripcion' ? 'Ver mis gatos' : 'Continuar comprando'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
