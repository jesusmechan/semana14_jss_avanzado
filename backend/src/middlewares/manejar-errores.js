import { HttpError } from '../errors/http-error.js';

export function rutaNoEncontrada(req, _res, next) {
  next(new HttpError(404, `Ruta ${req.method} ${req.originalUrl} no encontrada`));
}

export function manejarErrores(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La petición es demasiado grande (máximo 2 MB)' });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.detalles && { detalles: err.detalles }) });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
