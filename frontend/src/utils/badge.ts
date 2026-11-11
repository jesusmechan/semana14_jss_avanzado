import type { Badge } from '../types/producto';

const ETIQUETAS: Record<Badge, string> = { sale: 'Oferta', new: 'Nuevo', popular: 'Popular' };

export function etiquetaBadge(badge: Badge): string {
  return ETIQUETAS[badge] ?? badge;
}
