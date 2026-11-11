import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (!process.env.TOKEN_SECRET) {
  console.warn('TOKEN_SECRET no está definido: se usará una clave temporal y las sesiones se cerrarán al reiniciar.');
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  dbPath: process.env.DB_PATH || path.join(raiz, 'data', 'db.json'),
  // Orígenes permitidos separados por coma; por defecto el servidor de desarrollo de Angular.
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:4200').split(',').map((o) => o.trim()),
  tokenSecret: process.env.TOKEN_SECRET || randomBytes(32).toString('hex'),
  tokenDuracionHoras: Number(process.env.TOKEN_DURACION_HORAS) || 24 * 7,
  mpPublicKey: (process.env.MP_PUBLIC_KEY || '').trim(),
  mpAccessToken: (process.env.MP_ACCESS_TOKEN || '').trim(),
};
