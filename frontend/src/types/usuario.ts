export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'cliente' | 'admin';
  creadoEn?: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}
