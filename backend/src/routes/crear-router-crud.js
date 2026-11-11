import { Router } from 'express';
import { modificar, obtenerColeccion, siguienteId } from '../db/json-db.js';
import { HttpError, noEncontrado } from '../errors/http-error.js';
import { validar } from '../validators/validar.js';

function parsearId(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

/** Filtro por igualdad sobre los campos del esquema, ej. `GET /productos?categoria=perros`. */
function filtrar(items, query, campos) {
  const filtros = Object.entries(query).filter(([campo]) => campos.includes(campo));
  return items.filter((item) => filtros.every(([campo, valor]) => String(item[campo]) === String(valor)));
}

/**
 * Genera las rutas REST estándar de una colección:
 * GET /, GET /:id, POST /, PUT /:id, PATCH /:id y DELETE /:id.
 *
 * - `validarReglas(entidad, { db, id })`: reglas que dependen de otros datos (unicidad, relaciones).
 * - `validarEliminacion(entidad, { db })`: impide borrar registros en uso.
 * - `proteger`: middlewares que se ejecutan solo en las operaciones de escritura (ej. requerir rol admin).
 * - `porUsuario`: cada registro pertenece a `req.usuario`; los de otros usuarios responden 404.
 * - `conservar`: campos que gestiona el servidor y que un PUT no debe borrar.
 * - `presentar(entidad)`: transforma cada registro antes de enviarlo (ej. agregar campos calculados).
 */
export function crearRouterCrud({
  coleccion,
  recurso,
  esquema,
  validarReglas = () => {},
  validarEliminacion = () => {},
  proteger = [],
  porUsuario = false,
  conservar = [],
  presentar = (item) => item,
}) {
  const router = Router();
  const campos = ['id', ...Object.keys(esquema)];
  const camposConservados = porUsuario ? ['usuarioId', ...conservar] : conservar;

  const esVisible = (req) => (item) => !porUsuario || item.usuarioId === req.usuario.id;

  const buscarIndice = (items, id, req) => {
    const indice = items.findIndex((i) => i.id === id && esVisible(req)(i));
    if (indice === -1) throw noEncontrado(recurso, id);
    return indice;
  };

  router.get('/', async (req, res) => {
    const items = (await obtenerColeccion(coleccion)).filter(esVisible(req));
    res.json(filtrar(items, req.query, campos).map(presentar));
  });

  router.get('/:id', async (req, res) => {
    const id = parsearId(req.params.id);
    const item = (await obtenerColeccion(coleccion)).find((i) => i.id === id && esVisible(req)(i));
    if (!item) throw noEncontrado(recurso, id);
    res.json(presentar(item));
  });

  router.post('/', ...proteger, async (req, res) => {
    const datos = validar(esquema, req.body);
    const creado = await modificar(coleccion, (items, db) => {
      validarReglas(datos, { db, id: null });
      const nuevo = { id: siguienteId(items), ...(porUsuario && { usuarioId: req.usuario.id }), ...datos };
      items.push(nuevo);
      return nuevo;
    });
    res.status(201).location(`${req.baseUrl}/${creado.id}`).json(presentar(creado));
  });

  const actualizar = (parcial) => async (req, res) => {
    const id = parsearId(req.params.id);
    const cambios = validar(esquema, req.body, { parcial });
    const actualizado = await modificar(coleccion, (items, db) => {
      const indice = buscarIndice(items, id, req);
      const anterior = items[indice];
      const conservados = Object.fromEntries(
        camposConservados.filter((c) => c in anterior).map((c) => [c, anterior[c]])
      );
      const entidad = parcial ? { ...anterior, ...cambios } : { id, ...conservados, ...cambios };
      validarReglas(entidad, { db, id });
      items[indice] = entidad;
      return entidad;
    });
    res.json(presentar(actualizado));
  };

  router.put('/:id', ...proteger, actualizar(false));
  router.patch('/:id', ...proteger, actualizar(true));

  router.delete('/:id', ...proteger, async (req, res) => {
    const id = parsearId(req.params.id);
    await modificar(coleccion, (items, db) => {
      const indice = buscarIndice(items, id, req);
      validarEliminacion(items[indice], { db });
      items.splice(indice, 1);
    });
    res.status(204).end();
  });

  return router;
}
