import { PageLoading } from '../../components/page-loading'
import { PageMessage } from '../../components/page-message'
import { EntityFormPage, type EntityFormPageProps } from './entity-form-page'

export type EntityEditFormPageProps<TItem, TValues> = {
  isLoading: boolean
  isError: boolean
  data: TItem | undefined
  loadingTitle: string
  notFoundTitle: string
  notFoundMessage: string
  backTo: string
  defaultValues: (item: TItem) => TValues
  formKey?: (item: TItem) => string | number
  description?: string | ((item: TItem) => string)
} & Omit<EntityFormPageProps<TValues>, 'defaultValues' | 'formKey' | 'description'>

export function EntityEditFormPage<TItem, TValues>({
  isLoading,
  isError,
  data,
  loadingTitle,
  notFoundTitle,
  notFoundMessage,
  backTo,
  defaultValues,
  formKey,
  description,
  ...formPageProps
}: EntityEditFormPageProps<TItem, TValues>) {
  if (isLoading) {
    return <PageLoading title={loadingTitle} />
  }

  if (isError || !data) {
    return (
      <PageMessage title={notFoundTitle} message={notFoundMessage} backTo={backTo} />
    )
  }

  const resolvedDescription =
    typeof description === 'function' ? description(data) : description

  return (
    <EntityFormPage
      {...formPageProps}
      backTo={backTo}
      description={resolvedDescription}
      defaultValues={defaultValues(data)}
      formKey={formKey?.(data)}
    />
  )
}
