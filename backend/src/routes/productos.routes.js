import { datosInvalidos } from '../errors/http-error.js';
import { requerirRol } from '../middlewares/autenticar.js';
import { esquemaProducto } from '../validators/esquemas.js';
import { crearRouterCrud } from './crear-router-crud.js';

export const productosRouter = crearRouterCrud({
  coleccion: 'productos',
  recurso: 'Producto',
  esquema: esquemaProducto,
  proteger: [requerirRol('admin')],
  validarReglas: (producto, { db }) => {
    if (!db.categorias.some((c) => c.clave === producto.categoria)) {
      throw datosInvalidos({ categoria: `La categoría "${producto.categoria}" no existe` });
    }
    if (producto.precioAnterior !== null && producto.precioAnterior <= producto.precio) {
      throw datosInvalidos({ precioAnterior: 'Debe ser mayor que el precio actual' });
    }
  },
});
