import { ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import {
  IMAGE_ACCEPT,
  validateImageFile,
  type ImageFieldValue,
} from '../lib/image-field'
import { Button } from './button'
import { ConfirmDialog } from './confirm-dialog'
import { Thumbnail, type ThumbnailProps } from './thumbnail'

export type ImageFieldProps = {
  value?: ImageFieldValue
  onValueChange: (value: ImageFieldValue) => void
  disabled?: boolean
  alt?: string
  hint?: string
  id?: string
  size?: ThumbnailProps['size']
  'aria-invalid'?: boolean
}

function previewSrc(value: ImageFieldValue | undefined): string | null {
  if (!value) return null
  if (value.file) return null // object URL handled separately
  if (value.removed) return null
  return value.url ?? null
}

export function ImageField({
  value,
  onValueChange,
  disabled = false,
  alt = 'Imagen',
  hint = 'JPEG, PNG o WebP. Máximo 5 MB.',
  id,
  size = 'lg',
  'aria-invalid': ariaInvalid,
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    if (value?.file) {
      const url = URL.createObjectURL(value.file)
      objectUrlRef.current = url
      setObjectUrl(url)
    } else {
      setObjectUrl(null)
    }
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [value?.file])

  const displaySrc = objectUrl ?? previewSrc(value)
  const hasImage = Boolean(displaySrc)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    onValueChange({
      url: value?.url ?? null,
      file,
      removed: false,
    })
  }

  const handleRemove = () => {
    setError(null)
    setConfirmDeleteOpen(false)
    if (value?.file) {
      // Discard local pending file; keep remote url if any
      onValueChange({
        url: value.url ?? null,
        file: null,
        removed: false,
      })
      return
    }
    if (value?.url) {
      onValueChange({
        url: value.url,
        file: null,
        removed: true,
      })
    }
  }

  const requestRemove = () => {
    if (value?.file && !value.url) {
      // Local-only file: clear without confirm
      setError(null)
      onValueChange({
        url: null,
        file: null,
        removed: false,
      })
      return
    }
    setConfirmDeleteOpen(true)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <Thumbnail src={displaySrc} alt={alt} size={size} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm text-muted-foreground">{hint}</p>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={ImagePlus}
            label={hasImage ? 'Cambiar imagen' : 'Subir imagen'}
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          />
          {hasImage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Trash2}
              label="Eliminar"
              disabled={disabled}
              onClick={requestRemove}
            />
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          onChange={handleFileChange}
        />
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Eliminar imagen"
        description="¿Seguro que quieres eliminar esta imagen? Los cambios se aplicarán al guardar."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleRemove}
      />
    </div>
  )
}
