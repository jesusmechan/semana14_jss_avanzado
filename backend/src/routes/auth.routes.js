import { Router } from 'express';
import { modificar, obtenerColeccion, siguienteId } from '../db/json-db.js';
import { HttpError } from '../errors/http-error.js';
import { requerirSesion } from '../middlewares/autenticar.js';
import { emitirToken, hashPassword, verificarPassword } from '../services/seguridad.js';
import { esquemaLogin, esquemaRegistro } from '../validators/esquemas.js';
import { validar } from '../validators/validar.js';

export const authRouter = Router();

const perfil = ({ id, nombre, email, rol, creadoEn }) => ({ id, nombre, email, rol, creadoEn });
const sesion = (usuario) => ({ token: emitirToken(usuario), usuario: perfil(usuario) });

authRouter.post('/registro', async (req, res) => {
  const datos = validar(esquemaRegistro, req.body);
  const email = datos.email.toLowerCase();
  // El hash es costoso a propósito; se calcula fuera de la cola de escritura para no bloquearla.
  const passwordHash = await hashPassword(datos.password);

  const usuario = await modificar('usuarios', (usuarios) => {
    if (usuarios.some((u) => u.email === email)) {
      throw new HttpError(409, 'Ya existe una cuenta con ese correo');
    }
    const nuevo = {
      id: siguienteId(usuarios),
      nombre: datos.nombre,
      email,
      passwordHash,
      rol: 'cliente',
      creadoEn: new Date().toISOString(),
    };
    usuarios.push(nuevo);
    return nuevo;
  });

  res.status(201).json(sesion(usuario));
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = validar(esquemaLogin, req.body);
  const usuario = (await obtenerColeccion('usuarios')).find((u) => u.email === email.toLowerCase());
  // Mismo mensaje si el correo no existe o la contraseña falla, para no revelar qué cuentas existen.
  if (!usuario || !(await verificarPassword(password, usuario.passwordHash))) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }
  res.json(sesion(usuario));
});

authRouter.get('/perfil', requerirSesion, async (req, res) => {
  const usuario = (await obtenerColeccion('usuarios')).find((u) => u.id === req.usuario.id);
  if (!usuario) throw new HttpError(401, 'La cuenta ya no existe');
  res.json(perfil(usuario));
});
