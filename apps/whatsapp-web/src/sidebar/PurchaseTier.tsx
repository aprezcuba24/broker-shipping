import { useState } from 'react'
import {
  asPurchaseTier,
  purchaseTier,
  type BlacklistReason,
  type BlacklistStatus,
  type PurchaseTierValue,
} from '../purchase-tier'

export type { PurchaseTierValue, BlacklistStatus, BlacklistReason }
export { asPurchaseTier, purchaseTier }

const TIERS: { value: PurchaseTierValue; label: string }[] = [
  { value: 0, label: '0' },
  { value: 1, label: '+1' },
  { value: 5, label: '+5' },
  { value: 10, label: '+10' },
]

const REASON_OPTIONS: { value: BlacklistReason; label: string }[] = [
  { value: 'nonpayment', label: 'Impago' },
  { value: 'fraud', label: 'Fraude' },
  { value: 'abuse', label: 'Abuso' },
  { value: 'other', label: 'Otro' },
]

function tierAriaLabel(tier: PurchaseTierValue): string {
  if (tier === 0) return 'Calificación: sin historial'
  if (tier === 1) return 'Calificación: más de 1 compra'
  if (tier === 5) return 'Calificación: más de 5 compras'
  return 'Calificación: más de 10 compras'
}

function blacklistLabel(status: BlacklistStatus, otherCount: number): string {
  if (status === 'yes') return 'Sí'
  if (status === 'reported') {
    return otherCount > 0 ? `Reportado (${otherCount})` : 'Reportado'
  }
  return 'No'
}

type Props = {
  tier: PurchaseTierValue
  blacklist?: BlacklistStatus
  otherCount?: number
  blacklistBusy?: boolean
  onAddToBlacklist?: (input: {
    reason: BlacklistReason
    note?: string
  }) => void | Promise<void>
  onRemoveFromBlacklist?: () => void | Promise<void>
}

export function PurchaseTier({
  tier,
  blacklist = 'no',
  otherCount = 0,
  blacklistBusy = false,
  onAddToBlacklist,
  onRemoveFromBlacklist,
}: Props) {
  const current = tier
  const [addOpen, setAddOpen] = useState(false)
  const [reason, setReason] = useState<BlacklistReason>('fraud')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canAdd = Boolean(onAddToBlacklist) && blacklist !== 'yes'
  const canRemove = Boolean(onRemoveFromBlacklist) && blacklist === 'yes'
  const busy = blacklistBusy || submitting

  const badgeClass =
    blacklist === 'yes'
      ? 'is-yes'
      : blacklist === 'reported'
        ? 'is-reported'
        : 'is-no'

  async function handleAdd() {
    if (!onAddToBlacklist) return
    if (reason === 'other' && !note.trim()) return
    setSubmitting(true)
    try {
      await onAddToBlacklist({
        reason,
        note: note.trim() || undefined,
      })
      setAddOpen(false)
      setReason('fraud')
      setNote('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove() {
    if (!onRemoveFromBlacklist) return
    setSubmitting(true)
    try {
      await onRemoveFromBlacklist()
    } finally {
      setSubmitting(false)
    }
  }

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

      <div className="purchase-tier-blacklist-row">
        <p className={`purchase-tier-blacklist ${badgeClass}`}>
          Lista negra: {blacklistLabel(blacklist, otherCount)}
        </p>
        {canAdd ? (
          <button
            type="button"
            className="purchase-tier-action"
            disabled={busy}
            onClick={() => setAddOpen(true)}
          >
            Agregar
          </button>
        ) : null}
        {canRemove ? (
          <button
            type="button"
            className="purchase-tier-action"
            disabled={busy}
            onClick={() => void handleRemove()}
          >
            Quitar
          </button>
        ) : null}
      </div>

      {addOpen ? (
        <div className="purchase-tier-dialog" role="dialog" aria-modal="true">
          <p className="purchase-tier-dialog-title">Agregar a lista negra</p>
          <p className="purchase-tier-dialog-desc">
            El número queda en tu lista. Otras organizaciones verán que la
            comunidad lo reporta.
          </p>
          <label className="purchase-tier-field">
            <span>Motivo</span>
            <select
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as BlacklistReason)
              }
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {reason === 'other' ? (
            <label className="purchase-tier-field">
              <span>Nota</span>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                placeholder="Describe el motivo"
              />
            </label>
          ) : null}
          <div className="purchase-tier-dialog-actions">
            <button
              type="button"
              className="purchase-tier-action"
              disabled={busy}
              onClick={() => setAddOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="purchase-tier-action is-primary"
              disabled={busy || (reason === 'other' && !note.trim())}
              onClick={() => void handleAdd()}
            >
              Agregar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
