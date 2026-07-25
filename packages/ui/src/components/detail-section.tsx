import { type ReactNode } from 'react'

import { cn } from '../lib/utils'

export type DetailSectionField<TData> = {
  title: string
  accessor: (data: TData) => unknown
  format?: (value: unknown) => ReactNode
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

export function DetailSection<TData>({
  title,
  data,
  fields,
}: DetailSectionProps<TData>) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <dl className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3')}>
        {fields.map((field) => (
          <div key={field.title} className="space-y-1">
            <dt className="text-xs font-medium text-muted-foreground">{field.title}</dt>
            <dd className="text-sm text-foreground">
              {renderFieldValue(field.accessor(data), field.format)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
