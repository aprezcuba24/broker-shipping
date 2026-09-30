import {
  formatApiError,
  getGetMessagingSettingsMessagingSettingsProviderGetQueryKey,
  getListMessagingPricesMessagingPricesProviderGetQueryKey,
  useCreateMessagingPriceMessagingPricesProviderPost,
  useDeleteMessagingPriceMessagingPricesProviderPriceIdDelete,
  useGetMessagingSettingsMessagingSettingsProviderGet,
  useListMessagingPricesMessagingPricesProviderGet,
  usePatchMessagingPriceMessagingPricesProviderPriceIdPatch,
  usePatchMessagingSettingsMessagingSettingsProviderPatch,
  type CreateMessagingPriceMessagingPricesProviderPostParams,
  type DeleteMessagingPriceMessagingPricesProviderPriceIdDeleteParams,
  type GetMessagingSettingsMessagingSettingsProviderGetParams,
  type ListMessagingPricesMessagingPricesProviderGetParams,
  type MessagingPricePublic,
  type PatchMessagingPriceMessagingPricesProviderPriceIdPatchParams,
  type PatchMessagingSettingsMessagingSettingsProviderPatchParams,
} from '@broker/api'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  BtnConfirm,
  BtnLink,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldLabel,
  formatMoney,
  LocationFields,
  MoneyField,
  moneyDefault,
  moneySchema,
  notify,
  PageLoading,
  PageWrapper,
  Switch,
  useActiveOrganization,
  useQueryCacheSync,
} from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const addPriceSchema = z.object({
  province_id: z.string().uuid('Selecciona una provincia'),
  municipality_id: z.string().uuid('Selecciona un municipio'),
  neighborhood_id: z.string().uuid('Selecciona un barrio'),
  price: moneySchema,
})

type AddPriceValues = z.infer<typeof addPriceSchema>

const addPriceDefaults: AddPriceValues = {
  province_id: '',
  municipality_id: '',
  neighborhood_id: '',
  price: moneyDefault(),
}

function locationLabel(price: MessagingPricePublic): string {
  const parts = [
    price.province_name,
    price.municipality_name,
    price.neighborhood_name,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Barrio'
}

function MessagingPriceRow({
  price,
  onSaved,
}: {
  price: MessagingPricePublic
  onSaved: () => void
}) {
  const [draft, setDraft] = useState(price.price)
  const [error, setError] = useState<string | null>(null)
  const patchMutation = usePatchMessagingPriceMessagingPricesProviderPriceIdPatch()
  const deleteMutation =
    useDeleteMessagingPriceMessagingPricesProviderPriceIdDelete()

  useEffect(() => {
    setDraft(price.price)
  }, [price.price])

  const dirty =
    draft.amount !== price.price.amount || draft.currency !== price.price.currency

  const handleSave = async () => {
    setError(null)
    try {
      await patchMutation.mutateAsync({
        priceId: price.id,
        data: { price: draft },
        params: {} as PatchMessagingPriceMessagingPricesProviderPriceIdPatchParams,
      })
      notify.success('Precio actualizado')
      onSaved()
    } catch (caught) {
      setError(formatApiError(caught))
    }
  }

  const handleDelete = async () => {
    setError(null)
    try {
      await deleteMutation.mutateAsync({
        priceId: price.id,
        params: {} as DeleteMessagingPriceMessagingPricesProviderPriceIdDeleteParams,
      })
      notify.success('Precio eliminado')
      onSaved()
    } catch (caught) {
      setError(formatApiError(caught))
    }
  }

  return (
    <li className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium leading-snug">{locationLabel(price)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            Actual: {formatMoney(price.price.amount, price.price.currency)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:w-[16rem]">
          <MoneyField
            id={`messaging-price-${price.id}`}
            value={draft}
            onValueChange={setDraft}
            disabled={patchMutation.isPending || deleteMutation.isPending}
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            disabled={!dirty || patchMutation.isPending || deleteMutation.isPending}
            onClick={() => void handleSave()}
          >
            Guardar
          </Button>
          <BtnConfirm
            variant="outline"
            size="icon-sm"
            title="Eliminar precio"
            description={`Se eliminará el precio de mensajería para «${locationLabel(price)}». Las órdenes ya creadas no cambian.`}
            confirmLabel="Eliminar"
            confirmVariant="destructive"
            aria-label={`Eliminar ${locationLabel(price)}`}
            onConfirm={() => void handleDelete()}
            isLoading={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </BtnConfirm>
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </li>
  )
}

export function MessagingSettingsPage() {
  const { activeOrganization } = useActiveOrganization()
  const queryClient = useQueryClient()
  const listParams = {} as ListMessagingPricesMessagingPricesProviderGetParams
  const settingsParams = {} as GetMessagingSettingsMessagingSettingsProviderGetParams
  const listQueryKey =
    getListMessagingPricesMessagingPricesProviderGetQueryKey(listParams)
  const settingsQueryKey =
    getGetMessagingSettingsMessagingSettingsProviderGetQueryKey(settingsParams)

  const pricesQuery = useListMessagingPricesMessagingPricesProviderGet(listParams)
  const settingsQuery =
    useGetMessagingSettingsMessagingSettingsProviderGet(settingsParams)
  const createMutation = useCreateMessagingPriceMessagingPricesProviderPost()
  const settingsMutation =
    usePatchMessagingSettingsMessagingSettingsProviderPatch()

  const { sync } = useQueryCacheSync({
    invalidateKeys: [listQueryKey, settingsQueryKey],
  })

  const form = useForm<AddPriceValues>({
    resolver: zodResolver(addPriceSchema),
    defaultValues: addPriceDefaults,
  })

  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [accepts, setAccepts] = useState(false)

  useEffect(() => {
    if (settingsQuery.data) {
      setAccepts(settingsQuery.data.accepts_unconfigured_neighborhoods ?? false)
    }
  }, [settingsQuery.data])

  useEffect(() => {
    if (activeOrganization?.id) {
      void queryClient.invalidateQueries({ queryKey: listQueryKey })
      void queryClient.invalidateQueries({ queryKey: settingsQueryKey })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when org switches
  }, [activeOrganization?.id])

  const prices = pricesQuery.data ?? []
  const isLoading = pricesQuery.isLoading || settingsQuery.isLoading

  const handleAcceptsChange = async (next: boolean) => {
    const previous = accepts
    setAccepts(next)
    setSettingsError(null)
    try {
      await settingsMutation.mutateAsync({
        data: { accepts_unconfigured_neighborhoods: next },
        params: {} as PatchMessagingSettingsMessagingSettingsProviderPatchParams,
      })
      await sync()
      notify.success('Preferencia guardada')
    } catch (caught) {
      setAccepts(previous)
      setSettingsError(formatApiError(caught))
    }
  }

  const handleAdd = form.handleSubmit(async (values) => {
    setAddError(null)
    try {
      await createMutation.mutateAsync({
        data: {
          neighborhood_id: values.neighborhood_id,
          price: values.price,
        },
        params: {} as CreateMessagingPriceMessagingPricesProviderPostParams,
      })
      form.reset(addPriceDefaults)
      await sync()
      notify.success('Precio añadido')
    } catch (caught) {
      setAddError(formatApiError(caught))
    }
  })

  if (isLoading) {
    return <PageLoading title="Precio mensajería" />
  }

  return (
    <PageWrapper
      title="Precio mensajería"
      description="Configura el costo por barrio y si aceptas envíos a barrios sin precio."
      icon={Truck}
      leading={
        <BtnLink
          to="/settings"
          variant="outline"
          size="icon-sm"
          icon={ArrowLeft}
          aria-label="Volver a configurar"
        />
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Barrios sin configurar</CardTitle>
              <CardDescription>
                Si está apagado, solo se pueden crear órdenes hacia barrios con
                precio de mensajería.
              </CardDescription>
            </div>
            <Switch
              checked={accepts}
              onCheckedChange={(checked) => void handleAcceptsChange(checked)}
              disabled={settingsMutation.isPending}
              aria-label="Aceptar mensajería en barrios no configurados"
            />
          </CardHeader>
          {settingsError ? (
            <CardContent>
              <p className="text-sm text-destructive">{settingsError}</p>
            </CardContent>
          ) : null}
        </Card>

        <section className="space-y-3" aria-labelledby="messaging-prices-heading">
          <h2 id="messaging-prices-heading" className="text-sm font-medium">
            Lugares configurados
          </h2>
          {prices.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
              Todavía no hay precios. Añade un barrio abajo.
            </p>
          ) : (
            <ul className="space-y-3">
              {prices.map((price) => (
                <MessagingPriceRow
                  key={price.id}
                  price={price}
                  onSaved={() => {
                    void queryClient.invalidateQueries({ queryKey: listQueryKey })
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        <section
          className="space-y-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
          aria-labelledby="messaging-add-heading"
        >
          <h2 id="messaging-add-heading" className="text-sm font-medium">
            Añadir lugar
          </h2>
          <form className="space-y-4" onSubmit={(event) => void handleAdd(event)}>
            <LocationFields
              control={form.control}
              setValue={form.setValue}
              provinceName="province_id"
              municipalityName="municipality_id"
              neighborhoodName="neighborhood_id"
              layout="row"
            />
            <Field>
              <FieldLabel htmlFor="messaging-add-price">Precio</FieldLabel>
              <Controller
                control={form.control}
                name="price"
                render={({ field, fieldState }) => (
                  <>
                    <MoneyField
                      id="messaging-add-price"
                      value={field.value}
                      onValueChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                      disabled={createMutation.isPending}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </>
                )}
              />
            </Field>
            {addError ? (
              <p className="text-sm text-destructive">{addError}</p>
            ) : null}
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              <Plus className="h-4 w-4" />
              Añadir
            </Button>
          </form>
        </section>
      </div>
    </PageWrapper>
  )
}
