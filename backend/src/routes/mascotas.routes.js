import { HttpError } from '../errors/http-error.js';
import { calcularSuscripcion } from '../services/suscripcion.js';
import { esquemaMascota } from '../validators/esquemas.js';
import { crearRouterCrud } from './crear-router-crud.js';

// Debe montarse después de `requerirSesion`: cada usuario solo ve y edita sus mascotas.
export const mascotasRouter = crearRouterCrud({
  coleccion: 'mascotas',
  recurso: 'Mascota',
  esquema: esquemaMascota,
  porUsuario: true,
  conservar: ['entrega', 'suscripcionActiva'],
  // La suscripción se calcula al leer para que siempre refleje el peso, edad y comida actuales.
  presentar: ({ usuarioId, ...mascota }) => ({
    entrega: null,
    suscripcionActiva: false,
    ...mascota,
    suscripcion: calcularSuscripcion(mascota),
  }),
  validarEliminacion: (mascota) => {
    if (mascota.suscripcionActiva) {
      throw new HttpError(409, `${mascota.nombre} tiene una suscripción activa y no puede eliminarse`);
    }
  },
});
