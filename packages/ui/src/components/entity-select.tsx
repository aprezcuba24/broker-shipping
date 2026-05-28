import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

type EntityValue = string | number | null | undefined

export type EntitySelectProps<T extends object> = {
  items: T[]
  value?: string
  onValueChange: (value: string) => void
  valueKey?: keyof T
  labelKey?: keyof T
  placeholder?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
  triggerClassName?: string
  contentClassName?: string
}

export function EntitySelect<T extends object>({
  items,
  value,
  onValueChange,
  valueKey = 'id' as keyof T,
  labelKey = 'name' as keyof T,
  placeholder,
  disabled,
  id,
  'aria-label': ariaLabel,
  triggerClassName,
  contentClassName,
}: EntitySelectProps<T>) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" className={contentClassName}>
        {items.map((item, index) => {
          const itemValue = item[valueKey as keyof T] as EntityValue
          if (itemValue === null || itemValue === undefined || itemValue === '') {
            return null
          }

          const itemLabel = item[labelKey as keyof T]

          return (
            <SelectItem key={`${String(itemValue)}-${index}`} value={String(itemValue)}>
              {String(itemLabel ?? '')}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
