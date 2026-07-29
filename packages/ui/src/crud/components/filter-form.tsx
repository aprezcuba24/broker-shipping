import { useEffect } from 'react'
import { FormProvider, useForm, type DefaultValues, type FieldValues } from 'react-hook-form'

import { Button } from '../../components/button'
import { ListFilterBar } from '../../components/list-filter-bar'
import { ClearFiltersButton } from './clear-filters-button'

export type FilterFormProps<TValues extends FieldValues> = {
  values: TValues
  onApply: (values: TValues) => void
  onClear: () => void
  children: React.ReactNode
  applyLabel?: string
  clearLabel?: string
  className?: string
}

/** Filter form with Apply / Clear. Useful for expensive filter queries. */
export function FilterForm<TValues extends FieldValues>({
  values,
  onApply,
  onClear,
  children,
  applyLabel = 'Aplicar',
  clearLabel = 'Limpiar',
  className,
}: FilterFormProps<TValues>) {
  const form = useForm<TValues>({
    defaultValues: values as DefaultValues<TValues>,
  })

  useEffect(() => {
    form.reset(values)
  }, [form, values])

  return (
    <FormProvider {...form}>
      <form
        className={className}
        onSubmit={form.handleSubmit((next) => {
          onApply(next)
        })}
      >
        <ListFilterBar>
          {children}
          <div className="flex shrink-0 gap-2">
            <ClearFiltersButton
              label={clearLabel}
              onClear={() => {
                form.reset(values)
                onClear()
              }}
            />
            <Button type="submit" size="sm">
              {applyLabel}
            </Button>
          </div>
        </ListFilterBar>
      </form>
    </FormProvider>
  )
}
