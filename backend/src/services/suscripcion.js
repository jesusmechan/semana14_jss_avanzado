export const TIPOS_MASCOTA = ['perro', 'gato'];
export const TIPOS_COMIDA = ['basico', 'medio', 'premium'];
export const HORARIOS_ENTREGA = ['08:00 - 11:00', '11:00 - 14:00', '14:00 - 17:00', '17:00 - 20:00'];

// Precio por kg de comida según tipo de mascota y calidad.
const PRECIO_KG = {
  perro: { basico: 5, medio: 12.5, premium: 20 },
  gato: { basico: 7, medio: 11.5, premium: 16 },
};
const COSTO_PREMIOS = 10;
const COSTO_ENVIOS = 8;
const MARGEN = 0.25;
const DESCUENTO_SUSCRIPCION = 5;

const redondear = (valor) => Math.round(valor * 100) / 100;

/**
 * Calcula la suscripción mensual de alimento de una mascota.
 * La ración diaria usa el peso metabólico (peso^0.75 en perros, peso^0.67 en gatos)
 * y se ajusta por edad: cachorros comen más y mascotas mayores de 7 años, menos.
 */
export function calcularSuscripcion({ tipo, edad, peso, tipoComida }) {
  const base = tipo === 'perro' ? 35 * peso ** 0.75 : 25 * peso ** 0.67;
  const factorEdad = edad < 1 ? (tipo === 'perro' ? 1.4 : 1.5) : edad > 7 ? 0.9 : 1;
  const gramosDiarios = base * factorEdad;
  const kgMensuales = (gramosDiarios * 30) / 1000;
  const costoComida = kgMensuales * PRECIO_KG[tipo][tipoComida];
  const subtotal = costoComida + COSTO_PREMIOS + COSTO_ENVIOS;
  const precioAntesDescuento = subtotal / (1 - MARGEN);

  return {
    gramosDiarios: Math.round(gramosDiarios),
    kgMensuales: redondear(kgMensuales),
    costoComida: redondear(costoComida),
    costoPremios: COSTO_PREMIOS,
    costoEnvios: COSTO_ENVIOS,
    descuentoSuscripcion: DESCUENTO_SUSCRIPCION,
    precioMensualFinal: redondear(precioAntesDescuento - DESCUENTO_SUSCRIPCION),
  };
}
