import { HttpError } from '../errors/http-error.js';
import { verificarToken } from '../services/seguridad.js';

/**
 * Lee el header `Authorization: Bearer <token>` y deja `req.usuario = { id, rol }`.
 * Un token inválido o vencido no bloquea las rutas públicas: la petición sigue como invitado
 * y solo las rutas que exigen sesión responden 401.
 */
export function leerSesion(req, _res, next) {
  const [esquema, token] = (req.get('authorization') ?? '').split(' ');
  if (!token) return next();

  const datos = esquema === 'Bearer' ? verificarToken(token) : null;
  if (datos) req.usuario = { id: datos.sub, rol: datos.rol };
  else req.sesionVencida = true;
  next();
}

function exigirSesion(req) {
  if (req.usuario) return null;
  return new HttpError(401, req.sesionVencida ? 'La sesión expiró, vuelve a iniciar sesión' : 'Debes iniciar sesión');
}

export function requerirSesion(req, _res, next) {
  next(exigirSesion(req) ?? undefined);
}

export const requerirRol = (rol) => (req, _res, next) => {
  const error = exigirSesion(req);
  if (error) return next(error);
  if (req.usuario.rol !== rol) return next(new HttpError(403, 'No tienes permisos para esta operación'));
  next();
};
