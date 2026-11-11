import { HttpError } from '../errors/http-error.js';
import { requerirRol } from '../middlewares/autenticar.js';
import { esquemaCategoria } from '../validators/esquemas.js';
import { crearRouterCrud } from './crear-router-crud.js';

export const categoriasRouter = crearRouterCrud({
  coleccion: 'categorias',
  recurso: 'Categoría',
  esquema: esquemaCategoria,
  proteger: [requerirRol('admin')],
  validarReglas: (categoria, { db, id }) => {
    if (db.categorias.some((c) => c.clave === categoria.clave && c.id !== id)) {
      throw new HttpError(409, `La categoría "${categoria.clave}" ya existe`);
    }
    // Los productos guardan la clave de la categoría, así que cambiarla dejaría productos huérfanos.
    const actual = db.categorias.find((c) => c.id === id);
    if (actual && actual.clave !== categoria.clave && db.productos.some((p) => p.categoria === actual.clave)) {
      throw new HttpError(409, `La categoría "${actual.nombre}" tiene productos asociados y su clave no puede cambiar`);
    }
  },
  validarEliminacion: (categoria, { db }) => {
    if (db.productos.some((p) => p.categoria === categoria.clave)) {
      throw new HttpError(409, `La categoría "${categoria.nombre}" tiene productos asociados`);
    }
  },
});
