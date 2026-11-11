import { datosInvalidos, HttpError } from '../errors/http-error.js';

/**
 * Valida `datos` contra un esquema sencillo y devuelve solo los campos conocidos.
 * Con `parcial = true` (PATCH) los campos requeridos pueden omitirse.
 *
 * Reglas soportadas por campo: tipo ('string' | 'number' | 'integer' | 'boolean'),
 * requerido, defecto, min, max, minLength, maxLength, patron, opciones, mensaje.
 */
export function validar(esquema, datos, { parcial = false } = {}) {
  if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new HttpError(400, 'El cuerpo de la petición debe ser un objeto JSON');
  }

  const errores = {};
  const resultado = {};

  for (const [campo, regla] of Object.entries(esquema)) {
    const valor = typeof datos[campo] === 'string' ? datos[campo].trim() : datos[campo];
    const omitido = valor === undefined && parcial;

    if (valor === undefined || valor === null || valor === '') {
      if (omitido) continue;
      if (regla.defecto !== undefined) resultado[campo] = regla.defecto;
      else if (regla.requerido) errores[campo] = 'Es obligatorio';
      continue;
    }

    const error = validarCampo(valor, regla);
    if (error) errores[campo] = error;
    else resultado[campo] = valor;
  }

  if (Object.keys(errores).length > 0) {
    throw datosInvalidos(errores);
  }
  return resultado;
}

function validarCampo(valor, regla) {
  const { tipo } = regla;
  if (tipo === 'integer' && !Number.isInteger(valor)) return 'Debe ser un número entero';
  if (tipo === 'number' && (typeof valor !== 'number' || !Number.isFinite(valor))) return 'Debe ser un número';
  if (tipo === 'string' && typeof valor !== 'string') return 'Debe ser un texto';
  if (tipo === 'boolean' && typeof valor !== 'boolean') return 'Debe ser verdadero o falso';

  if (regla.opciones && !regla.opciones.includes(valor)) return `Debe ser uno de: ${regla.opciones.join(', ')}`;
  if (regla.min !== undefined && valor < regla.min) return `Debe ser mayor o igual a ${regla.min}`;
  if (regla.max !== undefined && valor > regla.max) return `Debe ser menor o igual a ${regla.max}`;
  if (regla.minLength !== undefined && valor.length < regla.minLength) return `Debe tener al menos ${regla.minLength} caracteres`;
  if (regla.maxLength !== undefined && valor.length > regla.maxLength) return `Debe tener como máximo ${regla.maxLength} caracteres`;
  if (regla.patron && !regla.patron.test(valor)) return regla.mensaje ?? 'Formato inválido';
  return null;
}
