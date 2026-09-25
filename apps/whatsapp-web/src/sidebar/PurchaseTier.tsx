import {
  asPurchaseTier,
  purchaseTier,
  type PurchaseTierValue,
} from '../purchase-tier'

export type { PurchaseTierValue }
export { asPurchaseTier, purchaseTier }

const TIERS: { value: PurchaseTierValue; label: string }[] = [
  { value: 0, label: '0' },
  { value: 1, label: '+1' },
  { value: 5, label: '+5' },
  { value: 10, label: '+10' },
]

function tierAriaLabel(tier: PurchaseTierValue): string {
  if (tier === 0) return 'Calificación: sin historial'
  if (tier === 1) return 'Calificación: más de 1 compra'
  if (tier === 5) return 'Calificación: más de 5 compras'
  return 'Calificación: más de 10 compras'
}

type Props = {
  tier: PurchaseTierValue
}

export function PurchaseTier({ tier }: Props) {
  const current = tier
  const blacklistValue = 'No'

  return (
    <div className="purchase-tier">
      <p className="purchase-tier-legend">Cantidad de compras generales</p>
      <ol
        className="purchase-tier-track"
        role="img"
        aria-label={tierAriaLabel(current)}
      >
        {TIERS.map((step, index) => {
          const reached = current >= step.value
          const isCurrent = current === step.value
          return (
            <li
              key={step.value}
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
                <span className="purchase-tier-label">{step.label}</span>
              </span>
            </li>
          )
        })}
      </ol>
      <p className="purchase-tier-blacklist">
        Lista negra: {blacklistValue}
      </p>
    </div>
  )
}
