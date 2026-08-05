import type { CurrencyAmount, OrderStatus, StatusCount } from '@broker/api'
import { formatDateTime } from '@broker/api'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Badge } from '../components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { formatMoney } from '../lib/utils'
import { cn } from '../lib/utils'
import {
  ORDER_ITEM_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  OrderStatusBadge,
} from '../order/status'

export type DashboardPeriodValue = '7d' | '30d' | '90d' | 'all'

export const DASHBOARD_PERIOD_OPTIONS: {
  value: DashboardPeriodValue
  label: string
}[] = [
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: 'all', label: 'Todo' },
]

export function formatCurrencyAmounts(amounts: CurrencyAmount[]): string {
  if (!amounts.length) return formatMoney(0, 'cup')
  return amounts.map((row) => formatMoney(row.amount, row.currency)).join(' · ')
}

export function DashboardPeriodSelector({
  value,
  onChange,
}: {
  value: DashboardPeriodValue
  onChange: (period: DashboardPeriodValue) => void
}) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
      {DASHBOARD_PERIOD_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: LucideIcon
  to?: string
}) {
  const body = (
    <Card className={cn(to && 'transition-colors hover:border-foreground/20')}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {label}
        </CardDescription>
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
  if (!to) return body
  return (
    <Link to={to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  )
}

export function StatusBreakdownCard({
  title,
  description,
  rows,
  labels,
}: {
  title: string
  description?: string
  rows: StatusCount[]
  labels: Record<string, string>
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => {
          const pct = total > 0 ? Math.round((row.count / total) * 100) : 0
          return (
            <div key={row.status} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {labels[row.status] ?? row.status}
                </span>
                <span className="tabular-nums font-medium">
                  {row.count}
                  <span className="ml-1 text-xs text-muted-foreground">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function DashboardAlert({
  children,
  to,
  tone = 'default',
}: {
  children: ReactNode
  to: string
  tone?: 'default' | 'warning'
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/50',
        tone === 'warning' && 'border-amber-500/40 bg-amber-500/5',
      )}
    >
      <span>{children}</span>
      <span className="text-xs font-medium text-muted-foreground">Ver →</span>
    </Link>
  )
}

export type RecentOrderRow = {
  id: string
  code: string
  status: OrderStatus
  created_at: string
  customer_name?: string | null
  totals: CurrencyAmount[]
}

export function RecentOrdersCard({
  orders,
  orderPath,
  emptyHint,
}: {
  orders: RecentOrderRow[]
  orderPath: (id: string) => string
  emptyHint: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Órdenes recientes</CardTitle>
        <CardDescription>Últimas 5 órdenes registradas</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          <ul className="divide-y">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to={orderPath(order.id)}
                  className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium tabular-nums">{order.code}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.customer_name ?? 'Sin cliente'} · {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 text-right text-xs font-medium tabular-nums">
                    {formatCurrencyAmounts(order.totals)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export type RecentCommissionRow = {
  id: string
  amount: number
  currency: string
  created_at: string
  counterpartyLabel?: string
}

export function RecentCommissionsCard({
  commissions,
  commissionPath,
  emptyHint,
  title = 'Comisiones pendientes',
}: {
  commissions: RecentCommissionRow[]
  commissionPath: (id: string) => string
  emptyHint: string
  title?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>Por cobrar o por pagar</CardDescription>
      </CardHeader>
      <CardContent>
        {commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          <ul className="divide-y">
            {commissions.map((row) => (
              <li key={row.id}>
                <Link
                  to={commissionPath(row.id)}
                  className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="font-medium tabular-nums">
                      {formatMoney(row.amount, row.currency)}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.counterpartyLabel ?? '—'} · {formatDateTime(row.created_at)}
                    </p>
                  </div>
                  <Badge variant="secondary">Pendiente</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export const DASHBOARD_ORDER_STATUS_LABELS: Record<string, string> = {
  ...ORDER_STATUS_LABEL,
}

export const DASHBOARD_ITEM_STATUS_LABELS: Record<string, string> = {
  ...ORDER_ITEM_STATUS_LABEL,
}
