import { useState } from 'react'

import { useDataTableView } from './data-table/data-table'
import { Button } from './button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { cn } from '../lib/utils'

export type ExpandableTextVariant = {
  previewChars?: number
  clampClassName?: string
  textClassName?: string
  expand?: 'dialog' | 'inline'
}

export type ExpandableTextProps = {
  text: string
  dialogTitle?: string
  /** Overrides applied when DataTable view is `cards`. Falls back to row defaults. */
  cards?: ExpandableTextVariant
  /** Overrides for the default (rows) variant. */
  rows?: ExpandableTextVariant
}

const DEFAULT_ROWS: Required<ExpandableTextVariant> = {
  previewChars: 80,
  clampClassName: 'line-clamp-2',
  textClassName: 'text-xs text-muted-foreground',
  expand: 'dialog',
}

function resolveVariant(
  base: Required<ExpandableTextVariant>,
  override?: ExpandableTextVariant,
): Required<ExpandableTextVariant> {
  return {
    previewChars: override?.previewChars ?? base.previewChars,
    clampClassName: override?.clampClassName ?? base.clampClassName,
    textClassName: override?.textClassName ?? base.textClassName,
    expand: override?.expand ?? base.expand,
  }
}

export function ExpandableText({
  text,
  dialogTitle = 'Detalle',
  cards,
  rows,
}: ExpandableTextProps) {
  const view = useDataTableView()
  const [expanded, setExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const rowVariant = resolveVariant(DEFAULT_ROWS, rows)
  const variant =
    view === 'cards' ? resolveVariant(rowVariant, cards) : rowVariant
  const needsExpand = text.length > variant.previewChars
  const showClamped = needsExpand && !(variant.expand === 'inline' && expanded)

  return (
    <div className="min-w-0">
      <p
        className={cn(
          variant.textClassName,
          showClamped ? variant.clampClassName : undefined,
          variant.expand === 'inline' || !showClamped
            ? 'whitespace-pre-wrap'
            : undefined,
        )}
      >
        {text}
      </p>
      {needsExpand ? (
        variant.expand === 'inline' ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 py-0 text-xs"
            onClick={(event) => {
              event.stopPropagation()
              setExpanded((value) => !value)
            }}
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-0 py-0 text-xs"
              onClick={(event) => {
                event.stopPropagation()
                setDialogOpen(true)
              }}
            >
              Ver más
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <p className="whitespace-pre-wrap text-sm text-on-surface">{text}</p>
              </DialogContent>
            </Dialog>
          </>
        )
      ) : null}
    </div>
  )
}
