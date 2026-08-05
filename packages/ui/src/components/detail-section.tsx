import { type ReactNode } from 'react'

import { cn } from '../lib/utils'

export type DetailSectionField<TData> = {
  title: string
  accessor: (data: TData) => unknown
  format?: (value: unknown) => ReactNode
  /** Span the full grid row (all columns). */
  fullWidth?: boolean
}

export type DetailSectionProps<TData> = {
  title: string
  data: TData
  fields: DetailSectionField<TData>[]
}

function renderFieldValue(value: unknown, format?: (value: unknown) => ReactNode): ReactNode {
  if (format) return format(value)
  if (value === null || value === undefined || value === '') return '—'
  return value as ReactNode
}

/** Stretch the last cell of an incomplete row so the grid doesn't leave a gap. */
function lastCellSpanClass<TData>(
  fields: DetailSectionField<TData>[],
  index: number,
): string | undefined {
  const field = fields[index]
  if (field.fullWidth) return 'col-span-full sm:border-r-0'

  let blockStart = 0
  for (let i = 0; i < index; i++) {
    if (fields[i].fullWidth) blockStart = i + 1
  }

  let blockEnd = fields.length
  for (let i = index + 1; i < fields.length; i++) {
    if (fields[i].fullWidth) {
      blockEnd = i
      break
    }
  }

  if (index !== blockEnd - 1) return undefined

  const blockLen = blockEnd - blockStart
  const rem2 = blockLen % 2
  const rem3 = blockLen % 3

  return cn(
    rem2 === 1 && 'sm:col-span-2 sm:border-r-0',
    rem3 === 1 && 'lg:col-span-3 lg:border-r-0',
    rem3 === 2 && 'lg:col-span-2 lg:border-r-0',
  )
}

export function DetailSection<TData>({
  title,
  data,
  fields,
}: DetailSectionProps<TData>) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border/70 bg-surface-container-lowest',
        'shadow-[0_1px_2px_rgba(42,52,57,0.04)]',
        'overflow-hidden',
      )}
    >
      <header
        className={cn(
          'flex items-center gap-3 border-b border-border/60',
          'bg-surface-container-low/60 px-4 py-3 sm:px-5',
        )}
      >
        <span
          className="h-4 w-1 shrink-0 rounded-full bg-ds-primary"
          aria-hidden
        />
        <h2 className="font-headline text-xs font-bold uppercase tracking-[0.14em] text-on-surface">
          {title}
        </h2>
      </header>

      <dl
        className={cn(
          'grid grid-cols-1 divide-y divide-border/50',
          'sm:grid-cols-2 lg:grid-cols-3 sm:divide-y-0',
        )}
      >
        {fields.map((field, index) => (
          <div
            key={field.title}
            className={cn(
              'flex flex-col gap-1.5 bg-surface-container-lowest px-4 py-3.5 sm:px-5 sm:py-4',
              'min-h-[4.25rem]',
              'sm:border-t sm:border-r sm:border-border/50',
              lastCellSpanClass(fields, index),
            )}
          >
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              {field.title}
            </dt>
            <dd className="text-sm font-medium text-on-surface break-words [&_a]:text-ds-primary [&_a]:underline-offset-4 [&_a]:hover:underline">
              {renderFieldValue(field.accessor(data), field.format)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
