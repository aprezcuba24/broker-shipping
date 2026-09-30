import {
  useListMunicipalitiesLocationsProvincesProvinceIdMunicipalitiesGet,
  useListNeighborhoodsForMunicipalityLocationsMunicipalitiesMunicipalityIdNeighborhoodsGet,
  useListProvincesLocationsProvincesGet,
  type MunicipalityPublic,
  type NeighborhoodPublic,
  type ProvincePublic,
} from '@broker/api'
import { useCallback, useImperativeHandle, useRef, useState, type Ref } from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form'

import { cn } from '../lib/utils'
import { EntityAutocomplete } from './entity-autocomplete'
import { FormFieldCell } from './form-section'
import { Field, FieldError, FieldLabel } from './ui/field'

const MIN_QUERY_LENGTH = 1

type LocationLabelKind = 'province' | 'municipality' | 'neighborhood'

function emptyLabelMaps(): Record<LocationLabelKind, Map<string, string>> {
  return {
    province: new Map(),
    municipality: new Map(),
    neighborhood: new Map(),
  }
}

export type LocationSelection = {
  province_id?: string | null
  province_name?: string | null
  municipality_id?: string | null
  municipality_name?: string | null
  neighborhood_id?: string | null
  neighborhood_name?: string | null
}

export type UseLocationFieldsOptions<T extends FieldValues> = {
  control: Control<T>
  setValue: UseFormSetValue<T>
  provinceName: FieldPath<T>
  municipalityName: FieldPath<T>
  neighborhoodName?: FieldPath<T>
  showNeighborhood?: boolean
}

export type UseLocationFieldsReturn = {
  provinceId: string
  municipalityId: string
  neighborhoodId: string
  provinces: ProvincePublic[]
  municipalities: MunicipalityPublic[]
  neighborhoods: NeighborhoodPublic[]
  provincesLoading: boolean
  municipalitiesLoading: boolean
  neighborhoodsLoading: boolean
  provincesError: boolean
  municipalitiesError: boolean
  neighborhoodsError: boolean
  provinceLabel: string | undefined
  municipalityLabel: string | undefined
  neighborhoodLabel: string | undefined
  onProvinceSearchChange: (query: string) => void
  onMunicipalitySearchChange: (query: string) => void
  onNeighborhoodSearchChange: (query: string) => void
  onProvinceChange: (value: string) => void
  onMunicipalityChange: (value: string) => void
  onProvinceSelect: (item: ProvincePublic) => void
  onMunicipalitySelect: (item: MunicipalityPublic) => void
  onNeighborhoodSelect: (item: NeighborhoodPublic) => void
  applySelection: (selection: LocationSelection) => void
  clearSelection: () => void
  showNeighborhood: boolean
}

function emptyFieldValue<T extends FieldValues>(): T[FieldPath<T>] {
  return '' as T[FieldPath<T>]
}

export function useLocationFields<T extends FieldValues>({
  control,
  setValue,
  provinceName,
  municipalityName,
  neighborhoodName,
  showNeighborhood = true,
}: UseLocationFieldsOptions<T>): UseLocationFieldsReturn {
  const includeNeighborhood = Boolean(showNeighborhood && neighborhoodName)

  const provinceId = (useWatch({ control, name: provinceName }) as string | undefined) ?? ''
  const municipalityId =
    (useWatch({ control, name: municipalityName }) as string | undefined) ?? ''
  const neighborhoodWatched = useWatch({
    control,
    name: (neighborhoodName ?? municipalityName) as FieldPath<T>,
  }) as string | undefined
  const neighborhoodId =
    includeNeighborhood && neighborhoodName ? (neighborhoodWatched ?? '') : ''

  const [provinceSearch, setProvinceSearch] = useState('')
  const [municipalitySearch, setMunicipalitySearch] = useState('')
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('')
  const labelsRef = useRef(emptyLabelMaps())
  const [, bumpLabels] = useState(0)

  const cacheLabel = useCallback((kind: LocationLabelKind, id: string, name: string) => {
    if (!id || !name) return
    labelsRef.current[kind].set(id, name)
    bumpLabels((n) => n + 1)
  }, [])

  const trimmedProvinceSearch = provinceSearch.trim()
  const trimmedMunicipalitySearch = municipalitySearch.trim()
  const trimmedNeighborhoodSearch = neighborhoodSearch.trim()

  const provincesQuery = useListProvincesLocationsProvincesGet(
    { name: trimmedProvinceSearch || undefined },
    {
      query: { enabled: trimmedProvinceSearch.length >= MIN_QUERY_LENGTH },
    },
  )

  const municipalitiesQuery =
    useListMunicipalitiesLocationsProvincesProvinceIdMunicipalitiesGet(
      provinceId,
      { name: trimmedMunicipalitySearch || undefined },
      {
        query: {
          enabled:
            Boolean(provinceId) && trimmedMunicipalitySearch.length >= MIN_QUERY_LENGTH,
        },
      },
    )

  const neighborhoodsQuery =
    useListNeighborhoodsForMunicipalityLocationsMunicipalitiesMunicipalityIdNeighborhoodsGet(
      municipalityId,
      { name: trimmedNeighborhoodSearch || undefined },
      {
        query: {
          enabled:
            includeNeighborhood &&
            Boolean(municipalityId) &&
            trimmedNeighborhoodSearch.length >= MIN_QUERY_LENGTH,
        },
      },
    )

  const clearNeighborhood = useCallback(() => {
    if (!neighborhoodName) return
    setValue(neighborhoodName, emptyFieldValue<T>(), {
      shouldDirty: true,
      shouldValidate: false,
    })
    setNeighborhoodSearch('')
  }, [neighborhoodName, setValue])

  const clearMunicipalityAndNeighborhood = useCallback(() => {
    setValue(municipalityName, emptyFieldValue<T>(), {
      shouldDirty: true,
      shouldValidate: false,
    })
    setMunicipalitySearch('')
    clearNeighborhood()
  }, [clearNeighborhood, municipalityName, setValue])

  const onProvinceChange = useCallback(
    (_value: string) => {
      clearMunicipalityAndNeighborhood()
    },
    [clearMunicipalityAndNeighborhood],
  )

  const onMunicipalityChange = useCallback(
    (_value: string) => {
      clearNeighborhood()
    },
    [clearNeighborhood],
  )

  const onProvinceSelect = useCallback(
    (item: ProvincePublic) => {
      cacheLabel('province', item.id, item.name)
    },
    [cacheLabel],
  )

  const onMunicipalitySelect = useCallback(
    (item: MunicipalityPublic) => {
      cacheLabel('municipality', item.id, item.name)
    },
    [cacheLabel],
  )

  const onNeighborhoodSelect = useCallback(
    (item: NeighborhoodPublic) => {
      cacheLabel('neighborhood', item.id, item.name)
    },
    [cacheLabel],
  )

  const applySelection = useCallback(
    (selection: LocationSelection) => {
      const nextProvinceId = selection.province_id ?? ''
      const nextMunicipalityId = selection.municipality_id ?? ''
      const nextNeighborhoodId = selection.neighborhood_id ?? ''

      if (nextProvinceId && selection.province_name) {
        cacheLabel('province', nextProvinceId, selection.province_name)
      }
      if (nextMunicipalityId && selection.municipality_name) {
        cacheLabel('municipality', nextMunicipalityId, selection.municipality_name)
      }
      if (nextNeighborhoodId && selection.neighborhood_name) {
        cacheLabel('neighborhood', nextNeighborhoodId, selection.neighborhood_name)
      }

      setValue(provinceName, nextProvinceId as T[FieldPath<T>], {
        shouldDirty: true,
        shouldValidate: false,
      })
      setValue(municipalityName, nextMunicipalityId as T[FieldPath<T>], {
        shouldDirty: true,
        shouldValidate: false,
      })
      if (neighborhoodName) {
        setValue(neighborhoodName, nextNeighborhoodId as T[FieldPath<T>], {
          shouldDirty: true,
          shouldValidate: false,
        })
      }

      setProvinceSearch('')
      setMunicipalitySearch('')
      setNeighborhoodSearch('')
    },
    [cacheLabel, municipalityName, neighborhoodName, provinceName, setValue],
  )

  const clearSelection = useCallback(() => {
    setValue(provinceName, emptyFieldValue<T>(), {
      shouldDirty: false,
      shouldValidate: false,
    })
    setValue(municipalityName, emptyFieldValue<T>(), {
      shouldDirty: false,
      shouldValidate: false,
    })
    if (neighborhoodName) {
      setValue(neighborhoodName, emptyFieldValue<T>(), {
        shouldDirty: false,
        shouldValidate: false,
      })
    }
    setProvinceSearch('')
    setMunicipalitySearch('')
    setNeighborhoodSearch('')
  }, [municipalityName, neighborhoodName, provinceName, setValue])

  return {
    provinceId,
    municipalityId,
    neighborhoodId,
    provinces: provincesQuery.data ?? [],
    municipalities: municipalitiesQuery.data ?? [],
    neighborhoods: neighborhoodsQuery.data ?? [],
    provincesLoading: provincesQuery.isFetching,
    municipalitiesLoading: municipalitiesQuery.isFetching,
    neighborhoodsLoading: neighborhoodsQuery.isFetching,
    provincesError: provincesQuery.isError,
    municipalitiesError: municipalitiesQuery.isError,
    neighborhoodsError: includeNeighborhood && neighborhoodsQuery.isError,
    provinceLabel: provinceId
      ? labelsRef.current.province.get(provinceId)
      : undefined,
    municipalityLabel: municipalityId
      ? labelsRef.current.municipality.get(municipalityId)
      : undefined,
    neighborhoodLabel: neighborhoodId
      ? labelsRef.current.neighborhood.get(neighborhoodId)
      : undefined,
    onProvinceSearchChange: setProvinceSearch,
    onMunicipalitySearchChange: setMunicipalitySearch,
    onNeighborhoodSearchChange: setNeighborhoodSearch,
    onProvinceChange,
    onMunicipalityChange,
    onProvinceSelect,
    onMunicipalitySelect,
    onNeighborhoodSelect,
    applySelection,
    clearSelection,
    showNeighborhood: includeNeighborhood,
  }
}

export type LocationFieldsHandle = {
  applySelection: (selection: LocationSelection) => void
  clearSelection: () => void
}

export type LocationFieldsProps<T extends FieldValues> = UseLocationFieldsOptions<T> & {
  disabled?: boolean
  provinceLabel?: string
  municipalityLabel?: string
  neighborhoodLabel?: string
  /** `row`: 3 columns from `sm` (standalone section). Default stacks for use inside FormSection. */
  layout?: 'stack' | 'row'
  ref?: Ref<LocationFieldsHandle>
}

export function LocationFields<T extends FieldValues>({
  control,
  setValue,
  provinceName,
  municipalityName,
  neighborhoodName,
  showNeighborhood = true,
  disabled = false,
  provinceLabel = 'Provincia',
  municipalityLabel = 'Municipio',
  neighborhoodLabel = 'Barrio',
  layout = 'stack',
  ref,
}: LocationFieldsProps<T>) {
  const state = useLocationFields({
    control,
    setValue,
    provinceName,
    municipalityName,
    neighborhoodName,
    showNeighborhood,
  })

  useImperativeHandle(
    ref,
    () => ({
      applySelection: state.applySelection,
      clearSelection: state.clearSelection,
    }),
    [state.applySelection, state.clearSelection],
  )

  const isRow = layout === 'row'
  const cellFullWidth = !isRow

  const fields = (
    <>
      <FormFieldCell fullWidth={cellFullWidth}>
        <Controller
          name={provinceName}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="location-province">{provinceLabel}</FieldLabel>
              <EntityAutocomplete
                id="location-province"
                items={state.provinces}
                value={field.value || undefined}
                selectedLabel={state.provinceLabel}
                onValueChange={(value) => {
                  field.onChange(value)
                  state.onProvinceChange(value)
                }}
                onItemSelect={state.onProvinceSelect}
                onSearchChange={state.onProvinceSearchChange}
                isLoading={state.provincesLoading}
                placeholder="Buscar provincia…"
                minQueryMessage="Escribe para buscar"
                emptyMessage="No se encontraron provincias."
                disabled={disabled}
                aria-invalid={fieldState.invalid}
              />
              {state.provincesError ? (
                <p className="text-sm text-destructive">
                  No se pudieron cargar las provincias.
                </p>
              ) : null}
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FormFieldCell>

      <FormFieldCell fullWidth={cellFullWidth}>
        <Controller
          name={municipalityName}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="location-municipality">{municipalityLabel}</FieldLabel>
              <EntityAutocomplete
                id="location-municipality"
                items={state.municipalities}
                value={field.value || undefined}
                selectedLabel={state.municipalityLabel}
                onValueChange={(value) => {
                  field.onChange(value)
                  state.onMunicipalityChange(value)
                }}
                onItemSelect={state.onMunicipalitySelect}
                onSearchChange={state.onMunicipalitySearchChange}
                isLoading={state.municipalitiesLoading}
                placeholder={
                  !state.provinceId
                    ? 'Selecciona una provincia primero'
                    : 'Buscar municipio…'
                }
                minQueryMessage="Escribe para buscar"
                emptyMessage="No se encontraron municipios."
                disabled={disabled || !state.provinceId}
                aria-invalid={fieldState.invalid}
              />
              {state.municipalitiesError ? (
                <p className="text-sm text-destructive">
                  No se pudieron cargar los municipios.
                </p>
              ) : null}
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FormFieldCell>

      {state.showNeighborhood && neighborhoodName ? (
        <FormFieldCell fullWidth={cellFullWidth} className={isRow ? 'sm:border-r-0' : undefined}>
          <Controller
            name={neighborhoodName}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="location-neighborhood">{neighborhoodLabel}</FieldLabel>
                <EntityAutocomplete
                  id="location-neighborhood"
                  items={state.neighborhoods}
                  value={field.value || undefined}
                  selectedLabel={state.neighborhoodLabel}
                  onValueChange={(value) => {
                    field.onChange(value)
                  }}
                  onItemSelect={state.onNeighborhoodSelect}
                  onSearchChange={state.onNeighborhoodSearchChange}
                  isLoading={state.neighborhoodsLoading}
                  placeholder={
                    !state.municipalityId
                      ? 'Selecciona un municipio primero'
                      : 'Buscar barrio…'
                  }
                  minQueryMessage="Escribe para buscar"
                  emptyMessage="No se encontraron barrios."
                  disabled={disabled || !state.municipalityId}
                  aria-invalid={fieldState.invalid}
                />
                {state.neighborhoodsError ? (
                  <p className="text-sm text-destructive">
                    No se pudieron cargar los barrios.
                  </p>
                ) : null}
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>
      ) : null}
    </>
  )

  if (!isRow) return fields

  return (
    <section
      data-slot="form-section"
      className={cn(
        'rounded-xl border border-border/70 bg-surface-container-lowest',
        'shadow-[0_1px_2px_rgba(42,52,57,0.04)]',
        'overflow-hidden',
      )}
    >
      <div
        className={cn(
          'grid grid-cols-1 divide-y divide-border/50',
          'sm:grid-cols-3 sm:divide-y-0',
        )}
      >
        {fields}
      </div>
    </section>
  )
}
