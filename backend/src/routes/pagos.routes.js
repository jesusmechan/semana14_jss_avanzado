import { Router } from 'express';
import { config } from '../config.js';
import { HttpError } from '../errors/http-error.js';

export const pagosRouter = Router();

/** La Public Key puede ir al navegador; el Access Token nunca sale de este servidor. */
pagosRouter.get('/config', async (_req, res) => {
  if (!config.mpPublicKey) {
    throw new HttpError(503, 'Falta MP_PUBLIC_KEY en el archivo .env del backend');
  }
  res.json({ publicKey: config.mpPublicKey });
});
