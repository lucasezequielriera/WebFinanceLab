# TransactionsTable Component

Un componente reutilizable para mostrar transacciones en una tabla elegante y responsive con tema oscuro.

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `transactions` | `Array` | `[]` | Array de transacciones a mostrar |
| `loading` | `boolean` | `false` | Estado de carga |
| `showSummary` | `boolean` | `true` | Mostrar resumen de totales |
| `maxHeight` | `string` | `'400px'` | Altura máxima de la tabla |

## Estructura de Transacciones

Cada transacción debe tener la siguiente estructura:

```javascript
{
  timestamp: Date, // Fecha de la transacción
  description: string, // Descripción de la transacción
  amount: number, // Monto de la transacción
  currency: 'ARS' | 'USD' // Moneda
}
```

## Características

- ✅ **Tema oscuro**: Diseño elegante con colores oscuros
- ✅ **Responsive**: Se adapta a diferentes tamaños de pantalla
- ✅ **Scroll sincronizado**: Header y footer fijos durante el scroll
- ✅ **Hover effects**: Efectos visuales al pasar el mouse
- ✅ **Resumen automático**: Calcula totales por moneda
- ✅ **Estados de carga**: Maneja estados de loading y vacío
- ✅ **Formato de números**: Localización argentina para montos
- ✅ **Iconos**: Iconos descriptivos para cada columna

## Uso

```jsx
import TransactionsTable from '../components/TransactionsTable';

// Uso básico
<TransactionsTable 
  transactions={transactions}
  loading={false}
/>

// Con configuración personalizada
<TransactionsTable 
  transactions={transactions}
  loading={loading}
  showSummary={true}
  maxHeight="500px"
/>
```

## Estilos

El componente incluye estilos inline optimizados para:
- Transparencia y efectos de blur
- Gradientes y sombras
- Colores consistentes con el tema
- Responsive design
- Scroll personalizado
