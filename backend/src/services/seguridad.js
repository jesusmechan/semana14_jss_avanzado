import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { config } from '../config.js';

const scryptAsync = promisify(scrypt);
const LONGITUD_CLAVE = 64;

/** Devuelve `salt:hash` en hexadecimal; nunca se guarda la contraseña en texto plano. */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(password, salt, LONGITUD_CLAVE);
  return `${salt}:${hash.toString('hex')}`;
}

export async function verificarPassword(password, guardado) {
  const [salt, hashHex = ''] = guardado.split(':');
  const esperado = Buffer.from(hashHex, 'hex');
  if (esperado.length !== LONGITUD_CLAVE) return false;
  const calculado = await scryptAsync(password, salt, LONGITUD_CLAVE);
  return timingSafeEqual(esperado, calculado);
}

const base64url = (texto) => Buffer.from(texto).toString('base64url');
const firmar = (contenido) => createHmac('sha256', config.tokenSecret).update(contenido).digest('base64url');

/** Token firmado con HMAC-SHA256: `payload.firma`, donde payload = { sub, rol, exp }. */
export function emitirToken(usuario) {
  const exp = Date.now() + config.tokenDuracionHoras * 60 * 60 * 1000;
  const payload = base64url(JSON.stringify({ sub: usuario.id, rol: usuario.rol, exp }));
  return `${payload}.${firmar(payload)}`;
}

/** Devuelve el payload si la firma es válida y no expiró; si no, `null`. */
export function verificarToken(token) {
  const [payload, firma] = token.split('.');
  if (!payload || !firma) return null;

  const esperada = Buffer.from(firmar(payload));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;

  try {
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    return datos.exp > Date.now() ? datos : null;
  } catch {
    return null;
  }
}
