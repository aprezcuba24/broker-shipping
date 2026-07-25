import { cn } from '@broker/ui'
import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  className?: string
}

export function QuantitySelector({ value, onChange, min = 1, className }: QuantitySelectorProps) {
  return (
    <div
      className={cn(
        'inline-flex w-fit shrink-0 items-center rounded-lg border border-border',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex size-7 items-center justify-center rounded-l-[calc(var(--radius-lg)-1px)] transition-colors active:bg-muted disabled:opacity-30"
      >
        <Minus className="size-3" strokeWidth={2} />
      </button>
      <span className="w-7 text-center text-[13px] font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex size-7 items-center justify-center rounded-r-[calc(var(--radius-lg)-1px)] transition-colors active:bg-muted"
      >
        <Plus className="size-3" strokeWidth={2} />
      </button>
    </div>
  )
}
