import { cn } from '../lib/utils'

export type PurchaseTierValue = 0 | 1 | 5 | 10

const TIERS: { value: PurchaseTierValue; label: string }[] = [
  { value: 0, label: '0' },
  { value: 1, label: '+1' },
  { value: 5, label: '+5' },
  { value: 10, label: '+10' },
]

/** Map exact purchase count to the coarsest public tier (never show the raw number). */
export function purchaseTier(count: number): PurchaseTierValue {
  if (count <= 0) return 0
  if (count < 5) return 1
  if (count < 10) return 5
  return 10
}

/** Coerce API / unknown values into a valid public tier. */
export function asPurchaseTier(value: unknown): PurchaseTierValue {
  if (value === 1 || value === 5 || value === 10) return value
  return 0
}

function tierAriaLabel(tier: PurchaseTierValue): string {
  if (tier === 0) return 'Calificación: sin historial'
  if (tier === 1) return 'Calificación: más de 1 compra'
  if (tier === 5) return 'Calificación: más de 5 compras'
  return 'Calificación: más de 10 compras'
}

export type PurchaseTierProps = {
  tier: PurchaseTierValue
  className?: string
}

export function PurchaseTier({ tier, className }: PurchaseTierProps) {
  const current = tier
  const blacklistValue = 'No'

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <p className="m-0 text-[11px] font-medium leading-tight text-muted-foreground">
        Cantidad de compras generales
      </p>
      <ol
        className="m-0 flex w-full list-none items-start p-0"
        role="img"
        aria-label={tierAriaLabel(current)}
      >
        {TIERS.map((step, index) => {
          const reached = current >= step.value
          const isCurrent = current === step.value
          return (
            <li
              key={step.value}
              className={cn(
                'flex min-w-0 items-start',
                index === 0 ? 'shrink-0 grow-0' : 'flex-1',
              )}
            >
              {index > 0 ? (
                <span
                  className={cn(
                    'mt-[7px] min-w-2 flex-1 self-start rounded-full h-0.5',
                    reached ? 'bg-primary/55' : 'bg-border',
                  )}
                  aria-hidden
                />
              ) : null}
              <span className="flex shrink-0 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'box-border size-4 rounded-full border-2',
                    reached
                      ? isCurrent
                        ? 'border-primary bg-primary shadow-[0_0_0_3px] shadow-primary/20'
                        : 'border-primary bg-primary/20'
                      : 'border-border bg-card',
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    'text-[11px] font-bold leading-none tracking-wide tabular-nums',
                    isCurrent
                      ? 'text-primary'
                      : reached
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
      <p className="m-0 inline-flex items-baseline self-start rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold leading-tight text-white">
        Lista negra: {blacklistValue}
      </p>
    </div>
  )
}
