export class HttpError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

export const noEncontrado = (recurso, id) => new HttpError(404, `${recurso} con id ${id} no existe`);

export const datosInvalidos = (detalles) => new HttpError(400, 'Datos inválidos', detalles);
