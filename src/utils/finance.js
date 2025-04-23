import dayjs from 'dayjs';

/**
 * Devuelve:
 *   spent   → gasto acumulado del 1 del mes a hoy
 *   allowed → límite diario × días transcurridos (incluye hoy)
 *
 * @param {Array<{ars:number, usd:number}>} data  –  el mismo array que ya
 *        usás para el gráfico (1 objeto por día con .ars y .usd)
 * @param {number} dailyLimit  –  tu límite diario
 */
export function calcHastaHoy(data, dailyLimit) {
  const spent = data.reduce(
    (tot, d) => tot + (d.ars || 0) + (d.usd || 0),
    0
  );
  const allowed = dailyLimit * dayjs().date();   // date() = día actual (1-31)
  return { spent, allowed };
}
