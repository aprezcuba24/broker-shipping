import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

type EntityValue = string | number | null | undefined

const ALL_OPTION_VALUE = '__all__'

export type EntitySelectAllOption = {
  label: string
  value?: string
}

export type EntitySelectProps<T extends object> = {
  items: T[]
  value?: string
  onValueChange: (value: string) => void
  valueKey?: keyof T
  labelKey?: keyof T
  placeholder?: string
  allOption?: EntitySelectAllOption
  disabled?: boolean
  id?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
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
  allOption,
  disabled,
  id,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  triggerClassName,
  contentClassName,
}: EntitySelectProps<T>) {
  const allValue = allOption?.value ?? ALL_OPTION_VALUE
  const selectValue = allOption && !value ? allValue : value

  const handleValueChange = (next: string) => {
    if (allOption && next === allValue) {
      onValueChange('')
      return
    }
    onValueChange(next)
  }

  return (
    <Select value={selectValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        className={triggerClassName}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" className={contentClassName}>
        {allOption && (
          <SelectItem value={allValue}>{allOption.label}</SelectItem>
        )}
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
