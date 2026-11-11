import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { leerSesion, requerirSesion } from './middlewares/autenticar.js';
import { manejarErrores, rutaNoEncontrada } from './middlewares/manejar-errores.js';
import { authRouter } from './routes/auth.routes.js';
import { categoriasRouter } from './routes/categorias.routes.js';
import { mascotasRouter } from './routes/mascotas.routes.js';
import { pagosRouter } from './routes/pagos.routes.js';
import { pedidosRouter } from './routes/pedidos.routes.js';
import { productosRouter } from './routes/productos.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigins }));
// Límite ampliado porque la foto de la mascota viaja como data URL dentro del JSON.
app.use(express.json({ limit: '2mb' }));
app.use(leerSesion);

app.get('/health', (_req, res) => res.json({ estado: 'ok' }));

app.use('/auth', authRouter);
app.use('/categorias', categoriasRouter);
app.use('/productos', productosRouter);
app.use('/mascotas', requerirSesion, mascotasRouter);
app.use('/pagos', pagosRouter);
app.use('/pedidos', pedidosRouter);

app.use(rutaNoEncontrada);
app.use(manejarErrores);
