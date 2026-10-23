import {
  useListMunicipalitiesStorefrontLocationsProvincesProvinceIdMunicipalitiesGet,
  useListNeighborhoodsStorefrontLocationsMunicipalitiesMunicipalityIdNeighborhoodsGet,
  useListProvincesStorefrontLocationsProvincesGet,
} from '@broker/api'
import { Field, FieldError, FieldLabel } from '@broker/ui'
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormSetValue,
} from 'react-hook-form'

type StoreLocationFieldsProps<T extends FieldValues> = {
  control: Control<T>
  setValue: UseFormSetValue<T>
  provinceName: Path<T>
  municipalityName: Path<T>
  neighborhoodName: Path<T>
  provinceId: string
  municipalityId: string
}

export function StoreLocationFields<T extends FieldValues>({
  control,
  setValue,
  provinceName,
  municipalityName,
  neighborhoodName,
  provinceId,
  municipalityId,
}: StoreLocationFieldsProps<T>) {
  const provincesQuery = useListProvincesStorefrontLocationsProvincesGet()
  const municipalitiesQuery =
    useListMunicipalitiesStorefrontLocationsProvincesProvinceIdMunicipalitiesGet(
      provinceId,
      undefined,
      { query: { enabled: Boolean(provinceId) } },
    )
  const neighborhoodsQuery =
    useListNeighborhoodsStorefrontLocationsMunicipalitiesMunicipalityIdNeighborhoodsGet(
      municipalityId,
      undefined,
      { query: { enabled: Boolean(municipalityId) } },
    )

  const provinces = provincesQuery.data ?? []
  const municipalities = municipalitiesQuery.data ?? []
  const neighborhoods = neighborhoodsQuery.data ?? []

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Controller
        control={control}
        name={provinceName}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Provincia</FieldLabel>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={field.value ?? ''}
              onChange={(event) => {
                field.onChange(event.target.value)
                setValue(municipalityName, '' as T[Path<T>])
                setValue(neighborhoodName, '' as T[Path<T>])
              }}
            >
              <option value="">Selecciona</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name={municipalityName}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Municipio</FieldLabel>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={field.value ?? ''}
              onChange={(event) => {
                field.onChange(event.target.value)
                setValue(neighborhoodName, '' as T[Path<T>])
              }}
              disabled={!provinceId}
            >
              <option value="">Selecciona</option>
              {municipalities.map((municipality) => (
                <option key={municipality.id} value={municipality.id}>
                  {municipality.name}
                </option>
              ))}
            </select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        control={control}
        name={neighborhoodName}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Barrio</FieldLabel>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={field.value ?? ''}
              onChange={(event) => field.onChange(event.target.value)}
              disabled={!municipalityId}
            >
              <option value="">Selecciona</option>
              {neighborhoods.map((neighborhood) => (
                <option key={neighborhood.id} value={neighborhood.id}>
                  {neighborhood.name}
                </option>
              ))}
            </select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}
