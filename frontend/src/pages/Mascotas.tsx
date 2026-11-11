import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mensajeDeError } from '../api/client';
import * as mascotasApi from '../api/mascotas';
import { useMascotaPendiente } from '../context/MascotaContext';
import { useToast } from '../context/ToastContext';
import { HORARIOS_ENTREGA, type DatosMascota, type Mascota, type TipoComida } from '../types/mascota';
import { soles } from '../utils/format';

const TAMANO_MAXIMO_FOTO = 1024 * 1024;

const formVacio = (): DatosMascota => ({
  nombre: '',
  tipo: 'gato',
  edad: 1,
  peso: 4.5,
  tipoComida: 'medio',
  icono: '🐱',
  foto: '',
});

const comidas: { valor: TipoComida; texto: string }[] = [
  { valor: 'basico', texto: 'Básica' },
  { valor: 'medio', texto: 'Media' },
  { valor: 'premium', texto: 'Premium' },
];

const iconos = ['🐱', '🐾', '😺', '🐈'];

export function Mascotas() {
  const toast = useToast();
  const navigate = useNavigate();
  const { setPendiente } = useMascotaPendiente();

  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState<DatosMascota>(formVacio);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [suscripcion, setSuscripcion] = useState({ mascotaId: 0, direccion: '', horario: '' });
  const [errorSuscripcion, setErrorSuscripcion] = useState('');

  const disponiblesParaSuscribir = useMemo(
    () => mascotas.filter((m) => !m.suscripcionActiva),
    [mascotas],
  );

  const cargar = () => {
    mascotasApi
      .listarMascotas()
      .then((lista) => {
        setMascotas(lista);
        setCargando(false);
        const disponibles = lista.filter((m) => !m.suscripcionActiva);
        setSuscripcion((s) => {
          if (disponibles.some((m) => m.id === s.mascotaId)) return s;
          const primera = disponibles[0];
          return {
            mascotaId: primera?.id ?? 0,
            direccion: primera?.entrega?.direccion ?? '',
            horario: primera?.entrega?.horario ?? '',
          };
        });
      })
      .catch((err) => {
        setError(mensajeDeError(err));
        setCargando(false);
      });
  };

  useEffect(() => {
    document.title = 'Mis gatos | DancyPet';
    cargar();
  }, []);

  const invalido = (campo: keyof DatosMascota) => {
    if (!tocados[campo]) return false;
    if (campo === 'nombre') return form.nombre.trim().length < 2 || form.nombre.length > 30;
    if (campo === 'edad') return form.edad < 0 || form.edad > 30;
    if (campo === 'peso') return form.peso < 0.1 || form.peso > 100;
    return false;
  };

  const nombreComida = (tipo: TipoComida) => comidas.find((c) => c.valor === tipo)?.texto ?? tipo;

  const alElegirFoto = (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > TAMANO_MAXIMO_FOTO) {
      setErrorForm('La foto debe pesar como máximo 1 MB.');
      return;
    }
    const lector = new FileReader();
    lector.onload = () => setForm((f) => ({ ...f, foto: lector.result as string }));
    lector.readAsDataURL(archivo);
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setTocados({ nombre: true, edad: true, peso: true });
    if (
      form.nombre.trim().length < 2 ||
      form.nombre.length > 30 ||
      form.edad < 0 ||
      form.edad > 30 ||
      form.peso < 0.1 ||
      form.peso > 100
    ) {
      return;
    }
    setGuardando(true);
    setErrorForm('');
    try {
      const mascota = editandoId
        ? await mascotasApi.actualizarMascota(editandoId, form)
        : await mascotasApi.crearMascota(form);
      toast.mostrar(editandoId ? `${mascota.nombre} fue actualizado` : `¡${mascota.nombre} ya tiene su perfil!`);
      cancelarEdicion();
      setGuardando(false);
      cargar();
    } catch (err) {
      setErrorForm(mensajeDeError(err));
      setGuardando(false);
    }
  };

  const editar = (mascota: Mascota) => {
    setEditandoId(mascota.id);
    const { nombre, tipo, edad, peso, tipoComida, icono, foto } = mascota;
    setForm({ nombre, tipo, edad, peso, tipoComida, icono, foto });
    setTocados({});
    document.getElementById('formMascota')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setErrorForm('');
    setForm(formVacio());
    setTocados({});
  };

  const eliminar = async (mascota: Mascota) => {
    if (!confirm(`¿Eliminar a ${mascota.nombre}?`)) return;
    try {
      await mascotasApi.eliminarMascota(mascota.id);
      toast.mostrar(`${mascota.nombre} fue eliminado`);
      cargar();
    } catch (err) {
      alert(mensajeDeError(err, 'No se pudo eliminar la mascota.'));
    }
  };

  const elegirParaSuscripcion = (id: number) => {
    const mascota = mascotas.find((m) => m.id === +id);
    setSuscripcion({
      mascotaId: mascota?.id ?? 0,
      direccion: mascota?.entrega?.direccion ?? '',
      horario: mascota?.entrega?.horario ?? '',
    });
  };

  const iniciarSuscripcion = (e: FormEvent) => {
    e.preventDefault();
    const mascota = mascotas.find((m) => m.id === +suscripcion.mascotaId);
    const direccion = suscripcion.direccion.trim();
    if (!mascota) {
      setErrorSuscripcion('Registra a tu gato primero.');
      return;
    }
    if (direccion.length < 10 || !suscripcion.horario) {
      setErrorSuscripcion('Completa la dirección (mínimo 10 caracteres) y el rango de horario.');
      return;
    }
    setErrorSuscripcion('');
    setPendiente({ mascota, entrega: { direccion, horario: suscripcion.horario } });
    navigate(`/pago?suscripcion=${mascota.id}`);
  };

  return (
    <section className="page">
      <div className="container pets-page">
        <div className="pets-view__header">
          <Link className="auth-link" to="/cuenta">
            ← Volver a mi cuenta
          </Link>
          <div className="section-header section-header--left">
            <span className="section-tag">Mi cuenta</span>
            <h2>Mis gatos</h2>
            <p>Registra sus datos y calcula una alimentación mensual personalizada.</p>
            <p className="pets-description">
              La suscripción incluye comida, entregas semanales y premios por un monto mensual.
            </p>
          </div>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="pets-layout">
          <div>
            <div className="pets-list">
              {!cargando && !mascotas.length && (
                <div className="pets-empty">Aún no has registrado el perfil de tu gato.</div>
              )}
              {mascotas.map((m) => (
                <article className="pet-card" key={m.id}>
                  <div className="pet-card__avatar">
                    {m.foto ? <img src={m.foto} alt={m.nombre} /> : m.icono}
                  </div>
                  <div>
                    <div className="pet-card__name">{m.nombre}</div>
                    <div className="pet-card__meta">
                      {m.edad} {m.edad === 1 ? 'año' : 'años'} · {m.peso} kg · Comida {nombreComida(m.tipoComida)}
                    </div>
                    <div className="pet-card__subscription">
                      {m.suscripcionActiva
                        ? `✅ Suscripción activa: ${soles(m.suscripcion.precioMensualFinal)} / mes`
                        : `Suscripción: ${soles(m.suscripcion.precioMensualFinal)} / mes · ${m.suscripcion.gramosDiarios} g diarios`}
                    </div>
                  </div>
                  <div className="pet-card__actions">
                    <button type="button" onClick={() => editar(m)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(m)}
                      disabled={m.suscripcionActiva}
                      title={m.suscripcionActiva ? 'Tiene una suscripción activa' : ''}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <section className="subscription-cta">
              <span className="section-tag">Alimentación sin preocupaciones</span>
              <h4>Empieza con la suscripción</h4>
              <p>
                Elige a tu gato y recibe su comida cada mes. El primer cargo se cobra con Mercado Pago (entorno de
                prueba).
              </p>
              <form className="subscription-cta__controls" onSubmit={iniciarSuscripcion} noValidate>
                <div className="subscription-field">
                  <label htmlFor="subscriptionPetSelect">Gato para suscribir</label>
                  <select
                    id="subscriptionPetSelect"
                    value={suscripcion.mascotaId}
                    onChange={(e) => elegirParaSuscripcion(+e.target.value)}
                    disabled={!disponiblesParaSuscribir.length}
                  >
                    {!disponiblesParaSuscribir.length && (
                      <option value={0}>
                        {mascotas.length ? 'Todos tus gatos ya están suscritos' : 'Registra a tu gato primero'}
                      </option>
                    )}
                    {disponiblesParaSuscribir.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="subscription-field">
                  <label htmlFor="subscriptionAddress">Dirección de entrega semanal</label>
                  <input
                    id="subscriptionAddress"
                    value={suscripcion.direccion}
                    onChange={(e) => setSuscripcion({ ...suscripcion, direccion: e.target.value })}
                  />
                </div>
                <div className="subscription-field">
                  <label htmlFor="subscriptionTime">Rango de horario</label>
                  <select
                    id="subscriptionTime"
                    value={suscripcion.horario}
                    onChange={(e) => setSuscripcion({ ...suscripcion, horario: e.target.value })}
                  >
                    <option value="">Selecciona un horario</option>
                    {HORARIOS_ENTREGA.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn--primary btn--lg"
                  type="submit"
                  disabled={!disponiblesParaSuscribir.length}
                >
                  Empezar con la suscripción
                </button>
              </form>
              {errorSuscripcion && (
                <p className="auth-error" role="alert">
                  {errorSuscripcion}
                </p>
              )}
            </section>
          </div>

          <form className="pet-form account__card" id="formMascota" onSubmit={guardar} noValidate>
            <h4>{editandoId ? `Editar a ${form.nombre}` : 'Registrar a tu gato'}</h4>
            <div className="pet-form__grid">
              <div className="form-group">
                <label htmlFor="petName">Nombre</label>
                <input
                  id="petName"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  onBlur={() => setTocados((t) => ({ ...t, nombre: true }))}
                  className={invalido('nombre') ? 'is-invalid' : undefined}
                />
                {invalido('nombre') && <small className="field-error">Entre 2 y 30 caracteres.</small>}
              </div>
              <div className="form-group">
                <label htmlFor="petAge">Edad (años)</label>
                <input
                  id="petAge"
                  type="number"
                  min={0}
                  max={30}
                  step={0.1}
                  value={form.edad}
                  onChange={(e) => setForm({ ...form, edad: Number(e.target.value) })}
                  onBlur={() => setTocados((t) => ({ ...t, edad: true }))}
                  className={invalido('edad') ? 'is-invalid' : undefined}
                />
                {invalido('edad') && <small className="field-error">Entre 0 y 30 años.</small>}
              </div>
              <div className="form-group">
                <label htmlFor="petWeight">Peso (kg)</label>
                <input
                  id="petWeight"
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={form.peso}
                  onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })}
                  onBlur={() => setTocados((t) => ({ ...t, peso: true }))}
                  className={invalido('peso') ? 'is-invalid' : undefined}
                />
                {invalido('peso') && <small className="field-error">Entre 0.1 y 100 kg.</small>}
              </div>
              <div className="form-group">
                <label htmlFor="petFood">Tipo de comida</label>
                <select
                  id="petFood"
                  value={form.tipoComida}
                  onChange={(e) => setForm({ ...form, tipoComida: e.target.value as TipoComida })}
                >
                  {comidas.map((c) => (
                    <option key={c.valor} value={c.valor}>
                      {c.texto}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="petIcon">Icono</label>
                <select
                  id="petIcon"
                  value={form.icono}
                  onChange={(e) => setForm({ ...form, icono: e.target.value })}
                >
                  {iconos.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="petPhoto">Foto (opcional, máx. 1 MB)</label>
              <input
                id="petPhoto"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={alElegirFoto}
              />
              {form.foto && (
                <div className="pet-form__preview">
                  <img src={form.foto} alt="Vista previa" />
                  <button className="auth-link" type="button" onClick={() => setForm({ ...form, foto: '' })}>
                    Quitar foto
                  </button>
                </div>
              )}
            </div>
            {errorForm && (
              <p className="auth-error" role="alert">
                {errorForm}
              </p>
            )}
            <div className="pet-form__actions">
              <button className="btn btn--primary btn--full" type="submit" disabled={guardando}>
                {editandoId ? 'Guardar cambios' : 'Registrar gato'}
              </button>
              {editandoId && (
                <button className="btn btn--ghost btn--full" type="button" onClick={cancelarEdicion}>
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
