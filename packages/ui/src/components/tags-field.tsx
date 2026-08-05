import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getListTagsTagsProviderGetQueryKey,
  useCreateTagTagsProviderPost,
  useListTagsTagsProviderGet,
  type CreateTagTagsProviderPostParams,
  type ListTagsTagsProviderGetParams,
  type TagPublic,
} from '@broker/api'
import { useQueryClient } from '@tanstack/react-query'

import { notify } from '../lib/notify'
import { TagMultiSelect, type TagOption } from './tag-multi-select'

export type TagsFieldProps = {
  value: string[]
  onValueChange: (ids: string[]) => void
  initialTags?: TagOption[]
  creatable?: boolean
  wrap?: boolean
  pageSize?: number
  disabled?: boolean
  id?: string
  className?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
}

function toTagOption(tag: Pick<TagPublic, 'id' | 'name'>): TagOption {
  return { id: tag.id, name: tag.name }
}

export function TagsField({
  value,
  onValueChange,
  initialTags = [],
  creatable = false,
  wrap = false,
  pageSize = 20,
  disabled = false,
  id,
  className,
  placeholder = 'Seleccionar etiquetas…',
  searchPlaceholder = 'Buscar etiqueta…',
  emptyMessage = 'No se encontraron etiquetas.',
  'aria-label': ariaLabel = 'Etiquetas',
  'aria-invalid': ariaInvalid,
}: TagsFieldProps) {
  const [search, setSearch] = useState('')
  const labelCacheRef = useRef(new Map<string, TagOption>())
  const [labelsVersion, bumpLabels] = useState(0)

  useEffect(() => {
    let changed = false
    for (const tag of initialTags) {
      const prev = labelCacheRef.current.get(tag.id)
      if (!prev || prev.name !== tag.name) {
        labelCacheRef.current.set(tag.id, tag)
        changed = true
      }
    }
    if (changed) {
      bumpLabels((n) => n + 1)
    }
  }, [initialTags])

  const listQuery = useListTagsTagsProviderGet({
    page: 1,
    page_size: pageSize,
    name: search || undefined,
    is_active: true,
  } as ListTagsTagsProviderGetParams)

  const createMutation = useCreateTagTagsProviderPost()
  const queryClient = useQueryClient()

  useEffect(() => {
    const items = listQuery.data?.items ?? []
    if (items.length === 0) return
    let changed = false
    for (const tag of items) {
      const option = toTagOption(tag)
      const prev = labelCacheRef.current.get(option.id)
      if (!prev || prev.name !== option.name) {
        labelCacheRef.current.set(option.id, option)
        changed = true
      }
    }
    if (changed) {
      bumpLabels((n) => n + 1)
    }
  }, [listQuery.data?.items])

  const options = useMemo(
    () => (listQuery.data?.items ?? []).map(toTagOption),
    [listQuery.data?.items],
  )

  const selectedLabels = useMemo(() => {
    return value.map(
      (tagId) => labelCacheRef.current.get(tagId) ?? { id: tagId, name: tagId },
    )
  }, [value, labelsVersion])

  const handleCreateOption = useCallback(
    async (name: string): Promise<TagOption | null> => {
      const trimmed = name.trim()
      if (!trimmed) return null

      const existing = (listQuery.data?.items ?? []).find(
        (tag) => tag.name.trim().toLowerCase() === trimmed.toLowerCase(),
      )
      if (existing) {
        const option = toTagOption(existing)
        labelCacheRef.current.set(option.id, option)
        bumpLabels((n) => n + 1)
        return option
      }

      try {
        const created = await createMutation.mutateAsync({
          data: { name: trimmed, is_active: true },
          params: {} as CreateTagTagsProviderPostParams,
        })
        const option = toTagOption(created)
        labelCacheRef.current.set(option.id, option)
        bumpLabels((n) => n + 1)
        void queryClient.invalidateQueries({
          queryKey: getListTagsTagsProviderGetQueryKey(),
        })
        notify.created('Etiqueta', 'f')
        return option
      } catch {
        const retry = await listQuery.refetch()
        const recovered = (retry.data?.items ?? []).find(
          (tag) => tag.name.trim().toLowerCase() === trimmed.toLowerCase(),
        )
        if (recovered) {
          const option = toTagOption(recovered)
          labelCacheRef.current.set(option.id, option)
          bumpLabels((n) => n + 1)
          return option
        }
        return null
      }
    },
    [createMutation, listQuery, queryClient],
  )

  return (
    <TagMultiSelect
      id={id}
      className={className}
      value={value}
      onValueChange={onValueChange}
      options={options}
      selectedLabels={selectedLabels}
      onSearchChange={setSearch}
      onCreateOption={creatable ? handleCreateOption : undefined}
      creatable={creatable}
      wrap={wrap}
      disabled={disabled}
      isLoading={listQuery.isFetching}
      isCreating={createMutation.isPending}
      aria-invalid={ariaInvalid}
      aria-label={ariaLabel}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
    />
  )
}
