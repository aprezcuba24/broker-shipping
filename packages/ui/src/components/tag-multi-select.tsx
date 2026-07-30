import { useEffect, useId, useRef, useState } from 'react'
import { ChevronsUpDown, Plus, X } from 'lucide-react'

import { cn } from '../lib/utils'
import { Badge } from './ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export type TagOption = {
  id: string
  name: string
}

export type TagMultiSelectProps = {
  value: string[]
  onValueChange: (ids: string[]) => void
  options: TagOption[]
  selectedLabels: TagOption[]
  onSearchChange: (query: string) => void
  onCreateOption?: (name: string) => Promise<TagOption | null>
  creatable?: boolean
  wrap?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  isLoading?: boolean
  isCreating?: boolean
  id?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
  className?: string
}

export function TagMultiSelect({
  value,
  onValueChange,
  options,
  selectedLabels,
  onSearchChange,
  onCreateOption,
  creatable = false,
  wrap = false,
  placeholder = 'Seleccionar etiquetas…',
  searchPlaceholder = 'Buscar etiqueta…',
  emptyMessage = 'No se encontraron etiquetas.',
  disabled = false,
  isLoading = false,
  isCreating = false,
  id,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  className,
}: TagMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const onSearchChangeRef = useRef(onSearchChange)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listId = useId()

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange
  }, [onSearchChange])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const selectedSet = new Set(value)
  const labelsById = new Map(selectedLabels.map((tag) => [tag.id, tag]))
  const selectedTags = value.map(
    (tagId) => labelsById.get(tagId) ?? { id: tagId, name: tagId },
  )

  const availableOptions = options.filter((option) => !selectedSet.has(option.id))
  const trimmedSearch = search.trim()
  const exactMatch = options.some(
    (option) => option.name.trim().toLowerCase() === trimmedSearch.toLowerCase(),
  )
  const canCreate =
    creatable &&
    Boolean(onCreateOption) &&
    trimmedSearch.length > 0 &&
    !exactMatch &&
    !selectedTags.some((tag) => tag.name.trim().toLowerCase() === trimmedSearch.toLowerCase())

  const scheduleSearchChange = (next: string) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onSearchChangeRef.current(next)
    }, 300)
  }

  const handleSearchChange = (next: string) => {
    setSearch(next)
    scheduleSearchChange(next)
  }

  const addTag = (tag: TagOption) => {
    if (selectedSet.has(tag.id)) return
    onValueChange([...value, tag.id])
    setSearch('')
    scheduleSearchChange('')
  }

  const removeTag = (tagId: string) => {
    onValueChange(value.filter((id) => id !== tagId))
  }

  const handleCreate = async () => {
    if (!onCreateOption || !canCreate || isCreating) return
    const created = await onCreateOption(trimmedSearch)
    if (created) {
      addTag(created)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            disabled={disabled}
            className={cn(
              'flex w-full items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background transition-colors',
              'hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              ariaInvalid ? 'border-destructive' : null,
              wrap ? 'min-h-10' : 'h-10',
            )}
          >
            <div
              className={cn(
                'flex min-w-0 flex-1 items-center gap-1.5',
                wrap
                  ? 'flex-wrap'
                  : 'flex-nowrap overflow-x-auto [scrollbar-width:thin]',
              )}
            >
              {selectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="max-w-[12rem] shrink-0 gap-1 pr-1 font-medium"
                >
                  <span className="truncate">{tag.name}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    className="rounded-sm p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      if (!disabled) {
                        removeTag(tag.id)
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        if (!disabled) {
                          removeTag(tag.id)
                        }
                      }
                    }}
                    aria-label={`Quitar ${tag.name}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))}
              {selectedTags.length === 0 ? (
                <span className="truncate px-1 text-muted-foreground">{placeholder}</span>
              ) : null}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={handleSearchChange}
            />
            <CommandList id={listId}>
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Buscando…</div>
              ) : (
                <>
                  {availableOptions.length === 0 && !canCreate ? (
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                  ) : null}
                  {availableOptions.length > 0 ? (
                    <CommandGroup>
                      {availableOptions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.id}
                          onSelect={() => {
                            addTag(option)
                            setOpen(true)
                          }}
                        >
                          {option.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : null}
                  {canCreate ? (
                    <CommandGroup>
                      <CommandItem
                        value={`__create__${trimmedSearch}`}
                        disabled={isCreating}
                        onSelect={() => {
                          void handleCreate()
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        {isCreating ? 'Creando…' : `Crear «${trimmedSearch}»`}
                      </CommandItem>
                    </CommandGroup>
                  ) : null}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
