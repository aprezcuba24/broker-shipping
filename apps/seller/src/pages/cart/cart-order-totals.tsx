import type { OrderCurrencyTotal } from '@broker/api'
import { formatMoney } from '@broker/ui'

export type CartOrderTotalsProps = {
  totals: OrderCurrencyTotal[]
  isLoading: boolean
  isError: boolean
  hasOrder: boolean
}

export function CartOrderTotals({
  totals,
  isLoading,
  isError,
  hasOrder,
}: CartOrderTotalsProps) {
  return (
    <div className="rounded-md border bg-muted/30 px-4 py-3">
      <h2 className="text-sm font-medium">Totales</h2>
      {isError ? (
        <p className="mt-2 text-sm text-destructive">No se pudieron calcular los totales.</p>
      ) : isLoading && !hasOrder ? (
        <p className="mt-2 text-sm text-muted-foreground">Calculando…</p>
      ) : totals.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {totals.map((total) => (
            <li key={total.currency} className="text-sm font-medium tabular-nums">
              {formatMoney(total.amount, total.currency)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">—</p>
      )}
    </div>
  )
}
