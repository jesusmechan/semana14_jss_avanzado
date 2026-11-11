import type { SyntheticEvent } from 'react';

export const IMAGEN_RESPALDO =
  'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop';

export function usarImagenRespaldo(evento: SyntheticEvent<HTMLImageElement>): void {
  const img = evento.currentTarget;
  if (img.dataset.respaldo) return;
  img.dataset.respaldo = '1';
  img.src = IMAGEN_RESPALDO;
}
