import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEventHandler,
  type Ref,
} from 'react'
import { cn } from '../lib/utils'
import { Input } from './ui/input'

type EntityValue = string | number | null | undefined

export type EntityAutocompleteProps<T extends object> = {
  items: T[]
  value?: string
  onValueChange: (value: string) => void
  onItemSelect?: (item: T) => void
  valueKey?: keyof T
  labelKey?: keyof T
  renderItem?: (item: T) => React.ReactNode

  onSearchChange: (query: string) => void
  minQueryLength?: number
  debounceMs?: number

  isLoading?: boolean
  placeholder?: string
  minQueryMessage?: string
  loadingMessage?: string
  emptyMessage?: string

  disabled?: boolean
  id?: string
  name?: string
  ref?: Ref<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  'aria-label'?: string
  'aria-invalid'?: boolean
  inputClassName?: string
  listClassName?: string
}

export function EntityAutocomplete<T extends object>({
  items,
  onValueChange,
  onItemSelect,
  valueKey = 'id' as keyof T,
  labelKey = 'name' as keyof T,
  renderItem,
  onSearchChange,
  minQueryLength = 1,
  debounceMs = 300,
  isLoading = false,
  placeholder,
  minQueryMessage = 'Escribe para buscar',
  loadingMessage = 'Buscando…',
  emptyMessage = 'No se encontraron resultados.',
  disabled,
  id,
  name,
  ref,
  onBlur,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  inputClassName,
  listClassName,
}: EntityAutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const onSearchChangeRef = useRef(onSearchChange)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listboxId = useId()

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

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const trimmedInput = inputValue.trim()
  const canSearch = trimmedInput.length >= minQueryLength

  const scheduleSearchChange = (next: string) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onSearchChangeRef.current(next)
    }, debounceMs)
  }

  const handleInputChange = (next: string) => {
    setInputValue(next)
    setIsOpen(true)
    scheduleSearchChange(next)
  }

  const selectItem = (item: T) => {
    const itemValue = item[valueKey as keyof T] as EntityValue
    if (itemValue === null || itemValue === undefined || itemValue === '') {
      return
    }

    onValueChange(String(itemValue))
    onItemSelect?.(item)
    setInputValue(String(item[labelKey as keyof T] ?? ''))
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        name={name}
        ref={ref}
        onBlur={onBlur}
        value={inputValue}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        className={inputClassName}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false)
          }
        }}
      />

      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            'absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background py-1 shadow-md',
            listClassName,
          )}
        >
          {!canSearch ? (
            <li
              role="presentation"
              className="px-3 py-2 text-sm text-muted-foreground"
            >
              {minQueryMessage}
            </li>
          ) : isLoading ? (
            <li
              role="presentation"
              className="px-3 py-2 text-sm text-muted-foreground"
            >
              {loadingMessage}
            </li>
          ) : items.length === 0 ? (
            <li
              role="presentation"
              className="px-3 py-2 text-sm text-muted-foreground"
            >
              {emptyMessage}
            </li>
          ) : (
            items.map((item, index) => {
              const itemValue = item[valueKey as keyof T] as EntityValue
              if (
                itemValue === null ||
                itemValue === undefined ||
                itemValue === ''
              ) {
                return null
              }

              const itemLabel = item[labelKey as keyof T]

              return (
                <li key={`${String(itemValue)}-${index}`} role="option">
                  <button
                    type="button"
                    className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectItem(item)}
                  >
                    {renderItem ? (
                      renderItem(item)
                    ) : (
                      <span className="font-medium text-foreground">
                        {String(itemLabel ?? '')}
                      </span>
                    )}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}
