import {
  CommissionComponentKind,
  type CommissionComponentPublic,
  type CommissionPublic,
  type Money,
} from '@broker/api'

import { formatCurrencyAmounts } from '../dashboard/dashboard-widgets'
import { formatMoney } from '../lib/utils'

const KIND_LABEL: Record<CommissionComponentKind, string> = {
  [CommissionComponentKind.provider_commission]: 'Comisión del proveedor',
  [CommissionComponentKind.price_markup]: 'Diferencia de precio',
}

function kindLabel(kind: CommissionComponentPublic['kind']): string {
  return KIND_LABEL[kind] ?? kind
}

type KindCurrencyKey = `${CommissionComponentPublic['kind']}:${Money['currency']}`

function sumByKindAndCurrency(
  components: CommissionComponentPublic[],
): Map<KindCurrencyKey, { kind: CommissionComponentPublic['kind']; total: Money }> {
  const totals = new Map<
    KindCurrencyKey,
    { kind: CommissionComponentPublic['kind']; total: Money }
  >()
  for (const component of components) {
    const key: KindCurrencyKey = `${component.kind}:${component.line_amount.currency}`
    const current = totals.get(key)
    if (!current) {
      totals.set(key, {
        kind: component.kind,
        total: { ...component.line_amount },
      })
      continue
    }
    totals.set(key, {
      kind: component.kind,
      total: {
        amount: current.total.amount + component.line_amount.amount,
        currency: current.total.currency,
      },
    })
  }
  return totals
}

function componentDescription(component: CommissionComponentPublic): string {
  const base = `${component.product_name} × ${component.quantity}`
  if (
    component.kind === CommissionComponentKind.price_markup &&
    component.unit_provider_price &&
    component.seller_provider_price
  ) {
    return `${base} · ${formatMoney(component.seller_provider_price)} − ${formatMoney(component.unit_provider_price)}`
  }
  return `${base} · ${formatMoney(component.unit_amount)} c/u`
}

export type CommissionBreakdownProps = {
  commission: CommissionPublic
}

export function CommissionBreakdown({ commission }: CommissionBreakdownProps) {
  const components = commission.components ?? []

  if (components.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-medium">Desglose</h2>
        <p className="text-sm text-muted-foreground">
          No hay detalle de conceptos para esta comisión.
        </p>
      </section>
    )
  }

  const subtotals = sumByKindAndCurrency(components)

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium">Desglose</h2>
      <div className="overflow-hidden rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {components.map((component) => (
            <li
              key={`${component.order_item_id}-${component.kind}`}
              className="flex items-start justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">{kindLabel(component.kind)}</p>
                <p className="text-xs text-muted-foreground">
                  {componentDescription(component)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatMoney(component.line_amount)}
              </span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t border-border bg-muted/40 px-4 py-3">
          {[...subtotals.entries()].map(([key, { kind, total }]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">
                Subtotal · {kindLabel(kind)}
              </span>
              <span className="font-medium tabular-nums">
                {formatMoney(total)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 text-sm font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {formatCurrencyAmounts(commission.amounts ?? [])}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
