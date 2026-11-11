/** 89.9 → "S/ 89.90" */
export function soles(monto: number | null | undefined): string {
  return `S/ ${(monto ?? 0).toFixed(2)}`;
}

export function truncar(valor: string | null | undefined, limite = 80, sufijo = '...'): string {
  if (!valor) return '';
  return valor.length > limite ? valor.substring(0, limite).trimEnd() + sufijo : valor;
}

export function soloDigitos(valor: string, maximo: number): string {
  return valor.replace(/\D/g, '').slice(0, maximo);
}

export function titleCase(valor: string): string {
  return valor ? valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase() : '';
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Formato peruano: "marzo 2026" o "10 mar 2026, 15:30" */
export function formatearFecha(iso: string, modo: 'mes-anio' | 'completo' = 'completo'): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  if (modo === 'mes-anio') {
    return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
  }
  const d = fecha.getDate();
  const mes = MESES_CORTO[fecha.getMonth()];
  const y = fecha.getFullYear();
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mm = String(fecha.getMinutes()).padStart(2, '0');
  return `${d} ${mes} ${y}, ${hh}:${mm}`;
}
