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

export type UseProvinceMunicipalityFieldsOptions<T extends FieldValues> = {
  control: Control<T>
  setValue: UseFormSetValue<T>
  provinceName: FieldPath<T>
  municipalityName: FieldPath<T>
}

export function useProvinceMunicipalityFields<T extends FieldValues>({
  control,
  setValue,
  provinceName,
  municipalityName,
}: UseProvinceMunicipalityFieldsOptions<T>) {
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

  return {
    provinceId,
    provinces: provincesQuery.data ?? [],
    municipalities: municipalitiesQuery.data ?? [],
    provincesLoading: provincesQuery.isLoading,
    municipalitiesLoading: Boolean(provinceId) && municipalitiesQuery.isFetching,
    provincesError: provincesQuery.isError,
    municipalitiesError: municipalitiesQuery.isError,
  }
}

export type ProvinceFormFieldProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  disabled?: boolean
  label?: string
  state: ReturnType<typeof useProvinceMunicipalityFields<T>>
}

export function ProvinceFormField<T extends FieldValues>({
  control,
  name,
  disabled = false,
  label = 'Provincia',
  state,
}: ProvinceFormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="province-select">{label}</FieldLabel>
          <EntitySelect
            id="province-select"
            items={state.provinces}
            value={field.value || undefined}
            onValueChange={field.onChange}
            placeholder={
              state.provincesLoading ? 'Cargando provincias…' : 'Selecciona una provincia'
            }
            disabled={disabled || state.provincesLoading}
            aria-invalid={fieldState.invalid}
          />
          {state.provincesError ? (
            <p className="text-sm text-destructive">No se pudieron cargar las provincias.</p>
          ) : null}
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  )
}

export type MunicipalityFormFieldProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  disabled?: boolean
  label?: string
  state: ReturnType<typeof useProvinceMunicipalityFields<T>>
}

export function MunicipalityFormField<T extends FieldValues>({
  control,
  name,
  disabled = false,
  label = 'Municipio',
  state,
}: MunicipalityFormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="municipality-select">{label}</FieldLabel>
          <EntitySelect
            id="municipality-select"
            items={state.municipalities}
            value={field.value || undefined}
            onValueChange={field.onChange}
            placeholder={
              !state.provinceId
                ? 'Selecciona una provincia primero'
                : state.municipalitiesLoading
                  ? 'Cargando municipios…'
                  : 'Selecciona un municipio'
            }
            disabled={disabled || !state.provinceId || state.municipalitiesLoading}
            aria-invalid={fieldState.invalid}
          />
          {state.municipalitiesError ? (
            <p className="text-sm text-destructive">No se pudieron cargar los municipios.</p>
          ) : null}
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  )
}

export type ProvinceMunicipalityFieldsProps<T extends FieldValues> =
  UseProvinceMunicipalityFieldsOptions<T> & {
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
  const state = useProvinceMunicipalityFields({
    control,
    setValue,
    provinceName,
    municipalityName,
  })

  return (
    <>
      <ProvinceFormField
        control={control}
        name={provinceName}
        disabled={disabled}
        label={provinceLabel}
        state={state}
      />
      <MunicipalityFormField
        control={control}
        name={municipalityName}
        disabled={disabled}
        label={municipalityLabel}
        state={state}
      />
    </>
  )
}
