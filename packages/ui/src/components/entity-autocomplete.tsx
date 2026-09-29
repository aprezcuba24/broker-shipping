import { useEffect, useId, useRef, useState, type FocusEventHandler, type Ref } from 'react'
import { cn } from '../lib/utils'
import { Input } from './ui/input'
import { Popover, PopoverAnchor, PopoverContent } from './ui/popover'

type EntityValue = string | number | null | undefined

export type EntityAutocompleteProps<T extends object> = {
  items: T[]
  value?: string
  selectedLabel?: string
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
  value,
  selectedLabel,
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
  const [inputValue, setInputValue] = useState(selectedLabel ?? '')
  const [anchorWidth, setAnchorWidth] = useState<number>()
  const anchorRef = useRef<HTMLDivElement>(null)
  const onSearchChangeRef = useRef(onSearchChange)
  const onValueChangeRef = useRef(onValueChange)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listboxId = useId()
  const committedLabelRef = useRef(selectedLabel ?? '')

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange
  }, [onSearchChange])

  useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (selectedLabel !== undefined && selectedLabel !== committedLabelRef.current) {
      committedLabelRef.current = selectedLabel
      setInputValue(selectedLabel)
    }
    if (!value && !selectedLabel) {
      committedLabelRef.current = ''
      setInputValue('')
    }
  }, [selectedLabel, value])

  useEffect(() => {
    if (!isOpen || disabled) return
    const node = anchorRef.current
    if (!node) return

    const syncWidth = () => setAnchorWidth(node.getBoundingClientRect().width)
    syncWidth()

    const observer = new ResizeObserver(syncWidth)
    observer.observe(node)
    return () => observer.disconnect()
  }, [isOpen, disabled])

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
    if (!disabled) setIsOpen(true)
    scheduleSearchChange(next)

    // Typing away from the committed selection clears the bound value.
    if (value && next.trim() !== committedLabelRef.current.trim()) {
      onValueChangeRef.current('')
      committedLabelRef.current = ''
    }
  }

  const selectItem = (item: T) => {
    const itemValue = item[valueKey as keyof T] as EntityValue
    if (itemValue === null || itemValue === undefined || itemValue === '') {
      return
    }

    const label = String(item[labelKey as keyof T] ?? '')
    onValueChange(String(itemValue))
    onItemSelect?.(item)
    committedLabelRef.current = label
    setInputValue(label)
    setIsOpen(false)
  }

  return (
    <Popover
      open={isOpen && !disabled}
      onOpenChange={(next) => {
        if (!disabled) setIsOpen(next)
      }}
    >
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="min-w-0 w-full">
          <Input
            id={id}
            name={name}
            ref={ref}
            onBlur={onBlur}
            value={inputValue}
            role="combobox"
            aria-expanded={isOpen && !disabled}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            className={cn('min-w-0', inputClassName)}
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={() => {
              if (!disabled) setIsOpen(true)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsOpen(false)
              }
            }}
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        id={listboxId}
        role="listbox"
        align="start"
        sideOffset={4}
        collisionPadding={8}
        style={anchorWidth ? { width: anchorWidth } : undefined}
        className={cn(
          'z-[60] max-h-60 max-w-[calc(100vw-1rem)] overflow-auto p-0 py-1',
          listClassName,
        )}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {!canSearch ? (
          <div role="presentation" className="px-3 py-2 text-sm text-muted-foreground">
            {minQueryMessage}
          </div>
        ) : isLoading ? (
          <div role="presentation" className="px-3 py-2 text-sm text-muted-foreground">
            {loadingMessage}
          </div>
        ) : items.length === 0 ? (
          <div role="presentation" className="px-3 py-2 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          items.map((item, index) => {
            const itemValue = item[valueKey as keyof T] as EntityValue
            if (itemValue === null || itemValue === undefined || itemValue === '') {
              return null
            }

            const itemLabel = item[labelKey as keyof T]

            return (
              <div key={`${String(itemValue)}-${index}`} role="option">
                <button
                  type="button"
                  className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectItem(item)}
                >
                  {renderItem ? (
                    renderItem(item)
                  ) : (
                    <span className="font-medium text-foreground">{String(itemLabel ?? '')}</span>
                  )}
                </button>
              </div>
            )
          })
        )}
      </PopoverContent>
    </Popover>
  )
}
