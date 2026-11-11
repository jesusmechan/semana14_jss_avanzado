export type TipoMascota = 'perro' | 'gato';
export type TipoComida = 'basico' | 'medio' | 'premium';

export const HORARIOS_ENTREGA = ['08:00 - 11:00', '11:00 - 14:00', '14:00 - 17:00', '17:00 - 20:00'];

export interface Entrega {
  direccion: string;
  horario: string;
}

export interface Suscripcion {
  gramosDiarios: number;
  kgMensuales: number;
  costoComida: number;
  costoPremios: number;
  costoEnvios: number;
  descuentoSuscripcion: number;
  precioMensualFinal: number;
}

export interface DatosMascota {
  nombre: string;
  tipo: TipoMascota;
  edad: number;
  peso: number;
  tipoComida: TipoComida;
  icono: string;
  foto: string;
}

export interface Mascota extends DatosMascota {
  id: number;
  entrega: Entrega | null;
  suscripcionActiva: boolean;
  suscripcion: Suscripcion;
}
