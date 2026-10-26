import {
  type OrganizationPlatformProductPublic,
  type PlatformProductCode,
} from '@broker/api'
import { Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { ButtonModal } from '../components/button-modal'
import { cn } from '../lib/utils'

export type AddPlatformProductProps = {
  /** Platform products the organization does not have access to yet. */
  availableProducts: OrganizationPlatformProductPublic[]
  onAdd: (codes: PlatformProductCode[]) => void | Promise<void>
  isSubmitting?: boolean
  triggerLabel?: string
}

export function AddPlatformProduct({
  availableProducts,
  onAdd,
  isSubmitting = false,
  triggerLabel = 'Añadir producto',
}: AddPlatformProductProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<PlatformProductCode>>(() => new Set())
  const [selectionError, setSelectionError] = useState<string | null>(null)

  const selectedList = useMemo(() => Array.from(selected), [selected])
  const hasAvailable = availableProducts.length > 0

  const resetSelection = useCallback(() => {
    setSelected(new Set())
    setSelectionError(null)
  }, [])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) {
        resetSelection()
      }
    },
    [resetSelection],
  )

  const toggleCode = useCallback((code: PlatformProductCode) => {
    setSelectionError(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }, [])

  const handleAccept = useCallback(async () => {
    if (!hasAvailable) {
      return
    }
    if (selectedList.length === 0) {
      setSelectionError('Selecciona al menos un producto.')
      throw new Error('Selecciona al menos un producto')
    }
    await onAdd(selectedList)
    resetSelection()
  }, [hasAvailable, onAdd, resetSelection, selectedList])

  return (
    <ButtonModal
      title="Añadir productos de plataforma"
      acceptLabel="Añadir"
      label={triggerLabel}
      icon={Plus}
      open={open}
      onOpenChange={handleOpenChange}
      onAccept={handleAccept}
      isLoading={isSubmitting}
      size="sm"
      contentClassName="sm:max-w-lg"
    >
      {hasAvailable ? (
        <div className="space-y-3">
          <ul className="space-y-3" role="list">
            {availableProducts.map((product) => {
              const checked = selected.has(product.code)
              return (
                <li key={product.code}>
                  <label
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors',
                      checked
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-muted/40',
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium leading-none">{product.name}</p>
                      {product.description ? (
                        <p className="text-sm text-muted-foreground">
                          {product.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-start pt-1">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={checked}
                        onChange={() => toggleCode(product.code)}
                        aria-label={product.name}
                      />
                    </div>
                  </label>
                </li>
              )
            })}
          </ul>
          {selectionError ? (
            <p className="text-sm text-destructive" role="alert">
              {selectionError}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Esta organización ya tiene acceso a todos los productos de plataforma.
        </p>
      )}
    </ButtonModal>
  )
}
