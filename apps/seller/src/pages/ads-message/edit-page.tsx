import {
  getGetAdsMessageFacebookAdsMessagesAdsMessageIdGetQueryKey,
  getListAdsMessagesFacebookAdsMessagesGetQueryKey,
  useGetAdsMessageFacebookAdsMessagesAdsMessageIdGet,
  usePatchAdsMessageFacebookAdsMessagesAdsMessageIdPatch,
  type AdsMessagePublic,
  type GetAdsMessageFacebookAdsMessagesAdsMessageIdGetParams,
  type PatchAdsMessageFacebookAdsMessagesAdsMessageIdPatchParams,
} from '@broker/api'
import {
  EntityEditFormPage,
  entityFormKey,
  useEntityFormMutation,
} from '@broker/ui'
import { Megaphone } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { AdsMessageForm, type AdsMessageFormValues } from './form'
import { useAdsMessageImagePersist } from './persist-image'

function adsMessageToFormValues(message: AdsMessagePublic): AdsMessageFormValues {
  return {
    title: message.title,
    description: message.description,
    image: {
      url: message.photo_url ?? null,
      file: null,
      removed: false,
    },
  }
}

export function AdsMessageEditPage() {
  const { adsMessageId = '' } = useParams<{ adsMessageId: string }>()

  const detailParams = {} as GetAdsMessageFacebookAdsMessagesAdsMessageIdGetParams
  const detailQueryKey = getGetAdsMessageFacebookAdsMessagesAdsMessageIdGetQueryKey(
    adsMessageId,
    detailParams,
  )
  const listQueryKey = getListAdsMessagesFacebookAdsMessagesGetQueryKey()

  const messageQuery = useGetAdsMessageFacebookAdsMessagesAdsMessageIdGet(
    adsMessageId,
    detailParams,
    { query: { enabled: Boolean(adsMessageId) } },
  )

  const patchMutation = usePatchAdsMessageFacebookAdsMessagesAdsMessageIdPatch()
  const { persist } = useAdsMessageImagePersist()

  const update = useEntityFormMutation({
    mutate: async (values: AdsMessageFormValues): Promise<AdsMessagePublic> => {
      const { image, ...data } = values
      const message = await patchMutation.mutateAsync({
        adsMessageId,
        data: {
          title: data.title,
          description: data.description,
        },
        params: {} as PatchAdsMessageFacebookAdsMessagesAdsMessageIdPatchParams,
      })
      return persist(message, image)
    },
    detailQueryKey,
    invalidateKeys: [listQueryKey, detailQueryKey],
    redirectTo: '/ads-messages',
    entityLabel: 'Anuncio',
    mode: 'update',
  })

  return (
    <EntityEditFormPage
      isLoading={messageQuery.isLoading}
      isError={messageQuery.isError}
      data={messageQuery.data}
      loadingTitle="Editar anuncio"
      notFoundTitle="Anuncio no encontrado"
      notFoundMessage="No se pudo cargar el anuncio solicitado."
      backTo="/ads-messages"
      title="Editar anuncio"
      description={(message) => `Edita «${message.title}».`}
      icon={Megaphone}
      Form={AdsMessageForm}
      defaultValues={adsMessageToFormValues}
      formKey={(message) => entityFormKey(message)}
      formProps={
        messageQuery.data ? { code: messageQuery.data.code } : undefined
      }
      onSubmit={update.run}
      isSubmitting={update.isPending}
      error={update.error}
      submitLabel="Guardar"
    />
  )
}
