import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatMonthToSpanish(date) {
  return format(date, 'MMMM', { locale: es });
}
