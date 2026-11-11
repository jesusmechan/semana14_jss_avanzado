import type { DatosRegistro, Sesion, Usuario } from '../types/usuario';
import { apiFetch } from './client';

export function login(email: string, password: string): Promise<Sesion> {
  return apiFetch<Sesion>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registrar(datos: DatosRegistro): Promise<Sesion> {
  return apiFetch<Sesion>('/auth/registro', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export function perfil(): Promise<Usuario> {
  return apiFetch<Usuario>('/auth/perfil');
}
