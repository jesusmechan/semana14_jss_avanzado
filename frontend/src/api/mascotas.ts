import type { DatosMascota, Mascota } from '../types/mascota';
import { apiFetch } from './client';

export function listarMascotas(): Promise<Mascota[]> {
  return apiFetch<Mascota[]>('/mascotas');
}

export function crearMascota(mascota: DatosMascota): Promise<Mascota> {
  return apiFetch<Mascota>('/mascotas', {
    method: 'POST',
    body: JSON.stringify(mascota),
  });
}

export function actualizarMascota(id: number, mascota: DatosMascota): Promise<Mascota> {
  return apiFetch<Mascota>(`/mascotas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(mascota),
  });
}

export function eliminarMascota(id: number): Promise<void> {
  return apiFetch<void>(`/mascotas/${id}`, { method: 'DELETE' });
}
