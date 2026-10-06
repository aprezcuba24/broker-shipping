import { useEffect, useRef, useState, type ChangeEvent, type ComponentProps } from 'react'
import { Input } from './ui/input'

export type DebouncedInputProps = Omit<
  ComponentProps<typeof Input>,
  'value' | 'defaultValue' | 'onChange'
> & {
  value?: string
  onDebouncedChange: (value: string) => void
  debounceMs?: number
  /** Transform the raw input before storing / notifying (e.g. digits only). */
  transformValue?: (value: string) => string
}

export function DebouncedInput({
  value = '',
  onDebouncedChange,
  debounceMs = 300,
  transformValue,
  ...inputProps
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const onDebouncedChangeRef = useRef(onDebouncedChange)
  const transformValueRef = useRef(transformValue)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange
  }, [onDebouncedChange])

  useEffect(() => {
    transformValueRef.current = transformValue
  }, [transformValue])

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
    const raw = event.target.value
    const next = transformValueRef.current ? transformValueRef.current(raw) : raw
    setLocalValue(next)
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onDebouncedChangeRef.current(next)
    }, debounceMs)
  }

  return <Input {...inputProps} value={localValue} onChange={handleChange} />
}
