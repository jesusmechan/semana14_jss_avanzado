import type { Badge } from '../types/producto';
import { etiquetaBadge } from '../utils/badge';

export function BadgeProducto({ badge }: { badge: Badge }) {
  return <span className={`product-card__badge product-card__badge--${badge}`}>{etiquetaBadge(badge)}</span>;
}
