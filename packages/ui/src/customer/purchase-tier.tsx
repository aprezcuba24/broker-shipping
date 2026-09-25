import { useState } from 'react'

import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { cn } from '../lib/utils'

export type PurchaseTierValue = 0 | 1 | 5 | 10

export type BlacklistStatus = 'no' | 'reported' | 'yes'

export type BlacklistReason = 'nonpayment' | 'fraud' | 'abuse' | 'other'

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

export function asBlacklistStatus(value: unknown): BlacklistStatus {
  if (value === 'reported' || value === 'yes') return value
  return 'no'
}

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

function blacklistBadgeClass(status: BlacklistStatus): string {
  if (status === 'yes') return 'bg-destructive text-white'
  if (status === 'reported') return 'bg-amber-600 text-white'
  return 'bg-emerald-600 text-white'
}

export type PurchaseTierProps = {
  tier: PurchaseTierValue
  blacklist?: BlacklistStatus
  otherCount?: number
  className?: string
  onAddToBlacklist?: (input: {
    reason: BlacklistReason
    note?: string
  }) => void | Promise<void>
  onRemoveFromBlacklist?: () => void | Promise<void>
  blacklistBusy?: boolean
}

export function PurchaseTier({
  tier,
  blacklist = 'no',
  otherCount = 0,
  className,
  onAddToBlacklist,
  onRemoveFromBlacklist,
  blacklistBusy = false,
}: PurchaseTierProps) {
  const current = tier
  const [addOpen, setAddOpen] = useState(false)
  const [reason, setReason] = useState<BlacklistReason>('fraud')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canAdd = Boolean(onAddToBlacklist) && blacklist !== 'yes'
  const canRemove = Boolean(onRemoveFromBlacklist) && blacklist === 'yes'
  const busy = blacklistBusy || submitting

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

      <div className="flex flex-wrap items-center gap-2">
        <p
          className={cn(
            'm-0 inline-flex items-baseline self-start rounded-md px-2 py-1 text-[11px] font-bold leading-tight',
            blacklistBadgeClass(blacklist),
          )}
        >
          Lista negra: {blacklistLabel(blacklist, otherCount)}
        </p>
        {canAdd ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={busy}
            onClick={() => setAddOpen(true)}
          >
            Agregar
          </Button>
        ) : null}
        {canRemove ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            disabled={busy}
            onClick={() => void handleRemove()}
          >
            Quitar
          </Button>
        ) : null}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar a lista negra</DialogTitle>
            <DialogDescription>
              El número queda en tu lista. Otras organizaciones verán que la
              comunidad lo reporta.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="blacklist-reason">Motivo</Label>
              <Select
                value={reason}
                onValueChange={(value) => setReason(value as BlacklistReason)}
              >
                <SelectTrigger id="blacklist-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {reason === 'other' ? (
              <div className="grid gap-1.5">
                <Label htmlFor="blacklist-note">Nota</Label>
                <Input
                  id="blacklist-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  placeholder="Describe el motivo"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleAdd()}
              disabled={busy || (reason === 'other' && !note.trim())}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
