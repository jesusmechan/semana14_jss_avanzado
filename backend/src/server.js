import { app } from './app.js';
import { config } from './config.js';

if (!config.mpAccessToken || !config.mpPublicKey) {
  console.warn('Mercado Pago no está configurado: define MP_ACCESS_TOKEN y MP_PUBLIC_KEY en backend/.env');
}

const servidor = app.listen(config.port, () => {
  console.log(`API de DancyPet escuchando en http://localhost:${config.port}`);
});

servidor.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto ${config.port} ya está en uso. Libéralo o usa otro: PORT=3002 npm run dev`);
    process.exit(1);
  }
  throw err;
});
