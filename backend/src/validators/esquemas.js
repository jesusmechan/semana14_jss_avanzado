import { HORARIOS_ENTREGA, TIPOS_COMIDA, TIPOS_MASCOTA } from '../services/suscripcion.js';

const EMAIL = /^[\w.+-]+@[\w-]+(\.[\w-]+)*\.\w{2,}$/;

// Las reglas replican las validaciones de los formularios de Angular para que la API no dependa del cliente.
export const esquemaCategoria = {
  clave: { tipo: 'string', requerido: true, patron: /^[a-z]{3,20}$/, mensaje: 'Solo letras minúsculas (3 a 20)' },
  nombre: { tipo: 'string', requerido: true, minLength: 3, maxLength: 30 },
  icono: { tipo: 'string', requerido: true, maxLength: 8 },
  subtitulo: { tipo: 'string', requerido: true, minLength: 3, maxLength: 40 },
};

export const esquemaProducto = {
  nombre: { tipo: 'string', requerido: true, minLength: 3, maxLength: 80 },
  descripcion: { tipo: 'string', requerido: true, maxLength: 300 },
  precio: { tipo: 'number', requerido: true, min: 0.1 },
  precioAnterior: { tipo: 'number', defecto: null, min: 0.1 },
  categoria: { tipo: 'string', requerido: true },
  tipo: { tipo: 'string', requerido: true, opciones: ['alimento', 'snack', 'juguete', 'accesorio', 'higiene'] },
  imagen: {
    tipo: 'string',
    requerido: true,
    patron: /^(https?:\/\/|\/imagenes\/).+/,
    mensaje: 'Debe ser una URL http(s) o una ruta /imagenes/...',
  },
  badge: { tipo: 'string', defecto: null, opciones: ['sale', 'new', 'popular'] },
  disponible: { tipo: 'boolean', defecto: true },
};

export const esquemaRegistro = {
  nombre: { tipo: 'string', requerido: true, minLength: 3, maxLength: 60 },
  email: { tipo: 'string', requerido: true, patron: EMAIL, mensaje: 'Correo electrónico inválido' },
  password: { tipo: 'string', requerido: true, minLength: 6, maxLength: 72 },
};

export const esquemaLogin = {
  email: { tipo: 'string', requerido: true },
  password: { tipo: 'string', requerido: true },
};

export const esquemaMascota = {
  nombre: { tipo: 'string', requerido: true, minLength: 2, maxLength: 30 },
  tipo: { tipo: 'string', requerido: true, opciones: TIPOS_MASCOTA },
  edad: { tipo: 'number', requerido: true, min: 0, max: 30 },
  peso: { tipo: 'number', requerido: true, min: 0.1, max: 100 },
  tipoComida: { tipo: 'string', requerido: true, opciones: TIPOS_COMIDA },
  icono: { tipo: 'string', defecto: '🐱', opciones: ['🐱', '🐾', '😺', '🐈'] },
  foto: {
    tipo: 'string',
    defecto: '',
    maxLength: 1_500_000,
    patron: /^data:image\/(png|jpeg|webp);base64,/,
    mensaje: 'Debe ser una imagen PNG, JPG o WEBP',
  },
};

export const esquemaEntrega = {
  direccion: { tipo: 'string', requerido: true, minLength: 10, maxLength: 150 },
  horario: { tipo: 'string', requerido: true, opciones: HORARIOS_ENTREGA },
};

export const esquemaPagoEfectivo = {
  nombre: { tipo: 'string', requerido: true, minLength: 3, maxLength: 60 },
  telefono: { tipo: 'string', requerido: true, patron: /^9\d{8}$/, mensaje: '9 dígitos, empieza con 9' },
  direccion: { tipo: 'string', requerido: true, minLength: 10, maxLength: 150 },
};
