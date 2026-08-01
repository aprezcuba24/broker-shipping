import type { OrderCurrencyTotal } from '@broker/api'
import { cn, formatMoney } from '@broker/ui'

export type CartOrderTotalsProps = {
  totals: OrderCurrencyTotal[]
  isInitialLoading: boolean
  isRefreshing?: boolean
  isError: boolean
  hasOrder: boolean
}

export function CartOrderTotals({
  totals,
  isInitialLoading,
  isRefreshing = false,
  isError,
  hasOrder,
}: CartOrderTotalsProps) {
  return (
    <div className="rounded-md border bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Totales</h2>
        {isRefreshing ? (
          <span className="text-xs text-muted-foreground">Actualizando…</span>
        ) : null}
      </div>
      {isError ? (
        <p className="mt-2 text-sm text-destructive">No se pudieron calcular los totales.</p>
      ) : isInitialLoading && !hasOrder ? (
        <p className="mt-2 text-sm text-muted-foreground">Calculando…</p>
      ) : totals.length > 0 ? (
        <ul
          className={cn(
            'mt-2 space-y-1 transition-opacity',
            isRefreshing && 'opacity-70',
          )}
        >
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
