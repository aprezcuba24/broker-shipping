import { Copy } from 'lucide-react'

import { Button } from './button'
import { notify } from '../lib/notify'

export type CopyTextButtonProps = {
  text: string
  label?: string
  successMessage?: string
  errorMessage?: string
}

export function CopyTextButton({
  text,
  label = 'Copiar',
  successMessage = 'Copiado',
  errorMessage = 'No se pudo copiar.',
}: CopyTextButtonProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      notify.success(successMessage)
    } catch (error) {
      notify.error(error, errorMessage)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      icon={Copy}
      label={label}
      onClick={() => void handleCopy()}
    />
  )
}
