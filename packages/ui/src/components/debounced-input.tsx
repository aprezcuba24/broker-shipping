import { useEffect, useRef, useState, type ChangeEvent, type ComponentProps } from 'react'
import { Input } from './ui/input'

export type DebouncedInputProps = Omit<
  ComponentProps<typeof Input>,
  'value' | 'defaultValue' | 'onChange'
> & {
  value?: string
  onDebouncedChange: (value: string) => void
  debounceMs?: number
}

export function DebouncedInput({
  value = '',
  onDebouncedChange,
  debounceMs = 300,
  ...inputProps
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const onDebouncedChangeRef = useRef(onDebouncedChange)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange
  }, [onDebouncedChange])

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    setLocalValue(next)
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onDebouncedChangeRef.current(next)
    }, debounceMs)
  }

  return (
    <Input
      {...inputProps}
      value={localValue}
      onChange={handleChange}
    />
  )
}
