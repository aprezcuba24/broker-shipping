import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Thumbnail, type ThumbnailProps } from '../../components/thumbnail'
import { formatMoney } from '../../lib/utils'
import { ColumnType, type ColumnDef } from '../../components/data-table/types'

type BaseColumnOptions<TData> = Omit<ColumnDef<TData>, 'type' | 'cell'> & {
  cell?: ColumnDef<TData>['cell']
}

export function textColumn<TData>(options: BaseColumnOptions<TData>): ColumnDef<TData> {
  return { type: ColumnType.Text, ...options }
}

export function dateColumn<TData>(options: BaseColumnOptions<TData>): ColumnDef<TData> {
  return { type: ColumnType.Date, ...options }
}

export function dateTimeColumn<TData>(options: BaseColumnOptions<TData>): ColumnDef<TData> {
  return { type: ColumnType.DateTime, ...options }
}

type TimestampColumnOptions<TData> = Partial<
  Omit<BaseColumnOptions<TData>, 'id' | 'accessor' | 'type'>
>

export function createdAtColumn<TData>(
  options: TimestampColumnOptions<TData> = {},
): ColumnDef<TData> {
  return dateTimeColumn({
    id: 'created_at',
    accessor: 'created_at' as keyof TData & string,
    hideOn: 'md',
    header: 'Creado',
    ...options,
  })
}

export function updatedAtColumn<TData>(
  options: TimestampColumnOptions<TData> = {},
): ColumnDef<TData> {
  return dateTimeColumn({
    id: 'updated_at',
    accessor: 'updated_at' as keyof TData & string,
    hideOn: 'md',
    header: 'Actualizado',
    ...options,
  })
}

export function numberColumn<TData>(options: BaseColumnOptions<TData>): ColumnDef<TData> {
  return { type: ColumnType.Number, align: options.align ?? 'right', ...options }
}

export function moneyColumn<TData>(
  options: BaseColumnOptions<TData> & {
    /** When true, accessor value is already in cents. Default true. */
    cents?: boolean
    /** Currency code for display. Default `"USD"`. */
    currency?: string
  },
): ColumnDef<TData> {
  const { cents = true, currency = 'USD', cell, ...rest } = options
  return {
    type: ColumnType.Number,
    align: rest.align ?? 'right',
    ...rest,
    cell:
      cell ??
      ((row) => {
        const key = rest.accessor ?? rest.id
        const value = (row as Record<string, unknown>)[key]
        if (value === null || value === undefined || value === '') return '—'
        const amount = Number(value)
        if (!Number.isFinite(amount)) return String(value)
        const centsValue = cents ? amount : Math.round(amount * 100)
        return formatMoney(centsValue, currency)
      }),
  }
}

export function currencyMoneyColumn<TData>(
  options: BaseColumnOptions<TData>,
): ColumnDef<TData> {
  const { cell, ...rest } = options
  return {
    type: ColumnType.Number,
    align: rest.align ?? 'right',
    ...rest,
    cell:
      cell ??
      ((row) => {
        const amountKey = rest.accessor ?? rest.id
        const value = (row as Record<string, unknown>)[amountKey]
        if (
          value === null ||
          value === undefined ||
          typeof value !== 'object' ||
          !('amount' in value) ||
          !('currency' in value)
        ) {
          return '—'
        }
        const money = value as { amount: unknown; currency: unknown }
        const cents = Number(money.amount)
        if (!Number.isFinite(cents) || typeof money.currency !== 'string' || !money.currency) {
          return '—'
        }
        return (
          <span className="tabular-nums text-sm">
            {formatMoney(cents, money.currency)}
          </span>
        )
      }),
  }
}

export function booleanColumn<TData>(options: BaseColumnOptions<TData>): ColumnDef<TData> {
  return { type: ColumnType.Boolean, ...options }
}

export function badgeColumn<TData>(
  options: BaseColumnOptions<TData> & {
    renderBadge: (row: TData) => ReactNode
  },
): ColumnDef<TData> {
  const { renderBadge, cell, ...rest } = options
  return {
    ...rest,
    cell: cell ?? ((row) => renderBadge(row)),
  }
}

export function componentColumn<TData>(
  id: string,
  name: string,
  component: (row: TData) => ReactNode,
  options: Partial<Omit<ColumnDef<TData>, 'id' | 'header' | 'cell'>> = {},
): ColumnDef<TData> {
  return {
    id,
    header: name,
    cell: component,
    ...options,
  }
}

export function imageColumn<TData>(
  options: {
    src: (row: TData) => string | null | undefined
    alt: (row: TData) => string
    size?: ThumbnailProps['size']
  } & Partial<Omit<ColumnDef<TData>, 'id' | 'header' | 'cell' | 'getImageSrc' | 'getImageAlt'>> & {
      id?: string
      header?: string
    },
): ColumnDef<TData> {
  const { src, alt, size = 'sm', id = 'image', header = 'Imagen', ...rest } = options
  return {
    id,
    header,
    getImageSrc: src,
    getImageAlt: alt,
    cell: (row) => <Thumbnail src={src(row)} alt={alt(row)} size={size} />,
    ...rest,
  }
}

export function linkColumn<TData>(
  options: BaseColumnOptions<TData> & {
    getHref: (row: TData) => string
    getLabel?: (row: TData) => ReactNode
  },
): ColumnDef<TData> {
  const { getHref, getLabel, cell, ...rest } = options
  return {
    type: ColumnType.Text,
    ...rest,
    cell:
      cell ??
      ((row) => {
        const key = rest.accessor ?? rest.id
        const label: ReactNode =
          getLabel?.(row) ??
          ((row as Record<string, unknown>)[key] as ReactNode | undefined)
        let content: ReactNode
        if (label == null || label === '') {
          content = '—'
        } else if (
          typeof label === 'string' ||
          typeof label === 'number' ||
          typeof label === 'boolean'
        ) {
          content = String(label)
        } else {
          content = label
        }
        return (
          <Link to={getHref(row)} className="text-primary underline-offset-2 hover:underline">
            {content}
          </Link>
        )
      }),
  }
}

type ActionsColumnOptions<TData> = Partial<Omit<ColumnDef<TData>, 'id' | 'cell'>>

export function actionsColumn<TData>(
  cell: (row: TData) => ReactNode,
  options: ActionsColumnOptions<TData> = {},
): ColumnDef<TData> {
  return {
    id: 'actions',
    align: 'right',
    header: '',
    ...options,
    cell,
  }
}
