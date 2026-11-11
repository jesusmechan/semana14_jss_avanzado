import { readFile, writeFile } from 'node:fs/promises';
import { config } from '../config.js';

let cola = Promise.resolve();

async function leer() {
  const contenido = await readFile(config.dbPath, 'utf-8');
  return JSON.parse(contenido);
}

async function guardar(datos) {
  await writeFile(config.dbPath, JSON.stringify(datos, null, 2) + '\n', 'utf-8');
}

export async function obtenerColeccion(nombre) {
  await cola;
  const datos = await leer();
  return datos[nombre] ?? [];
}

/**
 * Ejecuta una modificación sobre la base completa de forma serializada: las escrituras
 * concurrentes se encolan para que una petición no pise los cambios de otra.
 * Si la mutación lanza un error, el archivo no se modifica.
 */
export function transaccion(mutacion) {
  const operacion = cola.then(async () => {
    const datos = await leer();
    const resultado = await mutacion(datos);
    await guardar(datos);
    return resultado;
  });
  cola = operacion.catch(() => {});
  return operacion;
}

/**
 * Atajo de `transaccion` para una sola colección.
 * La mutación recibe la colección y la base completa (solo lectura) para validar relaciones.
 */
export function modificar(nombre, mutacion) {
  return transaccion(async (datos) => {
    const coleccion = datos[nombre] ?? [];
    const resultado = await mutacion(coleccion, datos);
    datos[nombre] = coleccion;
    return resultado;
  });
}

export function siguienteId(coleccion) {
  return coleccion.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}
