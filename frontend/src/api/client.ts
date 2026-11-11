import { API_URL } from '../config';

export class ApiError extends Error {
  status: number;
  detalles?: Record<string, string>;

  constructor(message: string, status: number, detalles?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detalles = detalles;
  }
}

type TokenGetter = () => string | null;
type OnUnauthorized = () => void;

let getToken: TokenGetter = () => null;
let onUnauthorized: OnUnauthorized = () => {};

export function configurarAuth(getter: TokenGetter, unauthorized: OnUnauthorized): void {
  getToken = getter;
  onUnauthorized = unauthorized;
}

export function mensajeDeError(err: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (err instanceof TypeError) return 'No se pudo conectar con la API. Ejecuta "npm run api".';
  if (!(err instanceof ApiError)) return porDefecto;
  if (err.status === 0) return 'No se pudo conectar con la API. Ejecuta "npm run api".';
  const detalles = err.detalles ? Object.values(err.detalles).join(' · ') : '';
  return [err.message, detalles].filter(Boolean).join(': ') || porDefecto;
}

export async function apiFetch<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const headers = new Headers(opciones.headers);
  if (!headers.has('Content-Type') && opciones.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers });
  } catch (err) {
    throw new ApiError('No se pudo conectar con la API. Ejecuta "npm run api".', 0);
  }

  // Solo cerrar sesión si sí enviamos un token y la API lo rechazó.
  if (respuesta.status === 401 && token) {
    onUnauthorized();
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }

  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ApiError(
      (cuerpo as { error?: string } | null)?.error || 'Error en la API',
      respuesta.status,
      (cuerpo as { detalles?: Record<string, string> } | null)?.detalles,
    );
  }

  return cuerpo as T;
}
