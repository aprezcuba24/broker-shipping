import {
  useListMunicipalitiesLocationsProvincesProvinceIdMunicipalitiesGet,
  useListProvincesLocationsProvincesGet,
} from '@broker/api'
import { useEffect, useRef } from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form'

import { EntitySelect } from './entity-select'
import { Field, FieldError, FieldLabel } from './ui/field'

export type ProvinceMunicipalityFieldsProps<T extends FieldValues> = {
  control: Control<T>
  setValue: UseFormSetValue<T>
  provinceName: FieldPath<T>
  municipalityName: FieldPath<T>
  disabled?: boolean
  provinceLabel?: string
  municipalityLabel?: string
}

export function ProvinceMunicipalityFields<T extends FieldValues>({
  control,
  setValue,
  provinceName,
  municipalityName,
  disabled = false,
  provinceLabel = 'Provincia',
  municipalityLabel = 'Municipio',
}: ProvinceMunicipalityFieldsProps<T>) {
  const provinceId = (useWatch({ control, name: provinceName }) as string | undefined) ?? ''
  const previousProvinceId = useRef(provinceId)

  useEffect(() => {
    if (previousProvinceId.current === provinceId) return
    previousProvinceId.current = provinceId
    setValue(municipalityName, '' as T[FieldPath<T>], {
      shouldDirty: true,
      shouldValidate: false,
    })
  }, [provinceId, municipalityName, setValue])

  const provincesQuery = useListProvincesLocationsProvincesGet()
  const municipalitiesQuery =
    useListMunicipalitiesLocationsProvincesProvinceIdMunicipalitiesGet(provinceId, {
      query: { enabled: Boolean(provinceId) },
    })

  const provinces = provincesQuery.data ?? []
  const municipalities = municipalitiesQuery.data ?? []
  const provincesLoading = provincesQuery.isLoading
  const municipalitiesLoading = Boolean(provinceId) && municipalitiesQuery.isFetching

  return (
    <>
      <Controller
        name={provinceName}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="province-select">{provinceLabel}</FieldLabel>
            <EntitySelect
              id="province-select"
              items={provinces}
              value={field.value || undefined}
              onValueChange={field.onChange}
              placeholder={
                provincesLoading ? 'Cargando provincias…' : 'Selecciona una provincia'
              }
              disabled={disabled || provincesLoading}
              aria-invalid={fieldState.invalid}
            />
            {provincesQuery.isError ? (
              <p className="text-sm text-destructive">No se pudieron cargar las provincias.</p>
            ) : null}
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />

      <Controller
        name={municipalityName}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="municipality-select">{municipalityLabel}</FieldLabel>
            <EntitySelect
              id="municipality-select"
              items={municipalities}
              value={field.value || undefined}
              onValueChange={field.onChange}
              placeholder={
                !provinceId
                  ? 'Selecciona una provincia primero'
                  : municipalitiesLoading
                    ? 'Cargando municipios…'
                    : 'Selecciona un municipio'
              }
              disabled={disabled || !provinceId || municipalitiesLoading}
              aria-invalid={fieldState.invalid}
            />
            {municipalitiesQuery.isError ? (
              <p className="text-sm text-destructive">No se pudieron cargar los municipios.</p>
            ) : null}
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
    </>
  )
}
