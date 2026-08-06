import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'

import { cn } from '../lib/utils'

export type FormSectionProps = {
  title?: string
  children: ReactNode
  className?: string
}

type FormFieldCellMeta = {
  fullWidth?: boolean
}

type FormFieldCellInternalProps = {
  _index?: number
  _meta?: FormFieldCellMeta[]
}

export type FormFieldCellProps = {
  children: ReactNode
  className?: string
  /** Span all columns in the grid row. */
  fullWidth?: boolean
}

function lastCellSpanClass(meta: FormFieldCellMeta[], index: number): string | undefined {
  const cell = meta[index]
  if (cell.fullWidth) return 'col-span-full sm:border-r-0'

  let blockStart = 0
  for (let i = 0; i < index; i++) {
    if (meta[i].fullWidth) blockStart = i + 1
  }

  let blockEnd = meta.length
  for (let i = index + 1; i < meta.length; i++) {
    if (meta[i].fullWidth) {
      blockEnd = i
      break
    }
  }

  if (index !== blockEnd - 1) return undefined

  const blockLen = blockEnd - blockStart
  if (blockLen % 2 === 1) return 'sm:col-span-2 sm:border-r-0'

  return undefined
}

const formFieldCellClassName = cn(
  'flex flex-col gap-1.5 bg-surface-container-lowest px-4 py-3.5 sm:px-5 sm:py-4',
  'min-h-[4.25rem]',
  'sm:border-t sm:border-r sm:border-border/50',
  '[&_[data-slot=field]]:gap-1.5',
  '[&_[data-slot=field-label]]:text-[11px] [&_[data-slot=field-label]]:font-semibold',
  '[&_[data-slot=field-label]]:uppercase [&_[data-slot=field-label]]:tracking-wider',
  '[&_[data-slot=field-label]]:text-on-surface-variant',
)

export function FormFieldCell({
  children,
  className,
  fullWidth = false,
  _index,
  _meta,
}: FormFieldCellProps & FormFieldCellInternalProps) {
  const spanClass =
    _meta && _index !== undefined ? lastCellSpanClass(_meta, _index) : undefined

  return (
    <div
      className={cn(
        formFieldCellClassName,
        fullWidth && 'col-span-full sm:border-r-0',
        spanClass,
        className,
      )}
    >
      {children}
    </div>
  )
}

function flattenFormFieldCells(children: ReactNode): ReactElement<
  FormFieldCellProps & FormFieldCellInternalProps
>[] {
  const cells: ReactElement<FormFieldCellProps & FormFieldCellInternalProps>[] = []

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return

    if (child.type === Fragment) {
      cells.push(
        ...flattenFormFieldCells((child.props as { children?: ReactNode }).children),
      )
      return
    }

    cells.push(child as ReactElement<FormFieldCellProps & FormFieldCellInternalProps>)
  })

  return cells
}

export function FormSection({ title, children, className }: FormSectionProps) {
  const cells = flattenFormFieldCells(children)

  const meta = cells.map((cell) => ({
    fullWidth: cell.props.fullWidth ?? false,
  }))

  return (
    <section
      className={cn(
        'rounded-xl border border-border/70 bg-surface-container-lowest',
        'shadow-[0_1px_2px_rgba(42,52,57,0.04)]',
        'overflow-hidden',
        className,
      )}
    >
      {title ? (
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
      ) : null}

      <div
        className={cn(
          'grid grid-cols-1 divide-y divide-border/50',
          'sm:grid-cols-2 sm:divide-y-0',
        )}
      >
        {cells.map((cell, index) =>
          cloneElement(cell, { _index: index, _meta: meta }),
        )}
      </div>
    </section>
  )
}
