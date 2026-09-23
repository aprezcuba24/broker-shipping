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

/**
 * Fixed mock count so the UI always lands on the +5 tier while developing.
 * Replace with a real API count when the backend is ready.
 */
export function mockPurchaseCount(_seed: string): number {
  return 7
}

function tierAriaLabel(tier: PurchaseTierValue): string {
  if (tier === 0) return 'Calificación: sin historial'
  if (tier === 1) return 'Calificación: más de 1 compra'
  if (tier === 5) return 'Calificación: más de 5 compras'
  return 'Calificación: más de 10 compras'
}

type Props = {
  /** Phone digits or other stable seed for the mock count. */
  seed: string
}

export function PurchaseTier({ seed }: Props) {
  const count = mockPurchaseCount(seed)
  const current = purchaseTier(count)

  return (
    <div
      className="purchase-tier"
      role="img"
      aria-label={tierAriaLabel(current)}
    >
      <p className="purchase-tier-legend">Cantidad de compras generales</p>
      <ol className="purchase-tier-track">
        {TIERS.map((tier, index) => {
          const reached = current >= tier.value
          const isCurrent = current === tier.value
          return (
            <li
              key={tier.value}
              className={[
                'purchase-tier-step',
                reached ? 'is-reached' : null,
                isCurrent ? 'is-current' : null,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {index > 0 ? (
                <span
                  className={[
                    'purchase-tier-connector',
                    reached ? 'is-reached' : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden
                />
              ) : null}
              <span className="purchase-tier-mark" aria-hidden>
                <span className="purchase-tier-dot" />
                <span className="purchase-tier-label">{tier.label}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
