import { ArrowLeft } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../components/button'
import { PageWrapper, type PageWrapperProps } from '../../components/page-wrapper'
import type { EntityFormHandle, EntityFormProps } from './entity-form-dialog'

export type EntityFormPageProps<TValues> = {
  Form: React.ComponentType<EntityFormProps<TValues>>
  onSubmit: (values: TValues) => unknown | Promise<unknown>
  defaultValues?: TValues
  isSubmitting?: boolean
  error?: string | null
  formKey?: string | number
  /** Extra props forwarded to `Form` (e.g. initialTags). */
  formProps?: Record<string, unknown>
  backTo?: string
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  title: string
  description?: string
  icon?: PageWrapperProps['icon']
  headerButtons?: ReactNode[]
}

export function EntityFormPage<TValues>({
  Form,
  onSubmit,
  defaultValues,
  isSubmitting = false,
  error = null,
  formKey,
  formProps,
  backTo,
  onCancel,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  title,
  description,
  icon,
  headerButtons,
}: EntityFormPageProps<TValues>) {
  const navigate = useNavigate()
  const formRef = useRef<EntityFormHandle>(null)

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
      return
    }
    if (backTo) {
      navigate(backTo)
      return
    }
    navigate(-1)
  }

  const handleSubmit = async () => {
    await formRef.current?.submit()
  }

  return (
    <PageWrapper
      title={title}
      description={description}
      icon={icon}
      leading={
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Volver"
          onClick={handleCancel}
        >
          <ArrowLeft aria-hidden />
        </Button>
      }
      buttons={headerButtons}
    >
      <div className="w-full space-y-6">
        <Form
          ref={formRef}
          key={formKey}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
          {...formProps}
        />

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-surface-container-high bg-background/95 py-3 backdrop-blur sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              void handleSubmit()
            }}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Guardando…' : submitLabel}
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
