import {
  useListMunicipalitiesStorefrontLocationsProvincesProvinceIdMunicipalitiesGet,
  useListProvincesStorefrontLocationsProvincesGet,
} from '@broker/api'
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
  provinceId: string
}

export function StoreLocationFields<T extends FieldValues>({
  control,
  setValue,
  provinceName,
  municipalityName,
  provinceId,
}: StoreLocationFieldsProps<T>) {
  const provincesQuery = useListProvincesStorefrontLocationsProvincesGet()
  const municipalitiesQuery =
    useListMunicipalitiesStorefrontLocationsProvincesProvinceIdMunicipalitiesGet(
      provinceId,
      undefined,
      { query: { enabled: Boolean(provinceId) } },
    )

  const provinces = provincesQuery.data ?? []
  const municipalities = municipalitiesQuery.data ?? []

  return (
    <div>
      <Controller
        control={control}
        name={provinceName}
        render={({ field, fieldState }) => (
          <label className="store-field">
            Provincia
            <select
              className="store-control"
              value={field.value ?? ''}
              onChange={(event) => {
                field.onChange(event.target.value)
                setValue(municipalityName, '' as T[Path<T>])
              }}
            >
              <option value="">Selecciona</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
            <span className="store-err">{fieldState.error?.message}</span>
          </label>
        )}
      />
      <Controller
        control={control}
        name={municipalityName}
        render={({ field, fieldState }) => (
          <label className="store-field">
            Municipio
            <select
              className="store-control"
              value={field.value ?? ''}
              onChange={(event) => {
                field.onChange(event.target.value)
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
            <span className="store-err">{fieldState.error?.message}</span>
          </label>
        )}
      />
    </div>
  )
}
