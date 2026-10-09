import {
  getListAdsMessagesFacebookAdsMessagesGetQueryKey,
  useCreateAdsMessageFacebookAdsMessagesPost,
  type AdsMessagePublic,
  type CreateAdsMessageFacebookAdsMessagesPostParams,
} from '@broker/api'
import { EntityFormPage, notify, useEntityFormMutation } from '@broker/ui'
import { Megaphone } from 'lucide-react'

import {
  AdsMessageForm,
  adsMessageFormDefaultValues,
  type AdsMessageFormValues,
} from './form'
import { useAdsMessageImagePersist } from './persist-image'

export function AdsMessageCreatePage() {
  const createMutation = useCreateAdsMessageFacebookAdsMessagesPost()
  const { persist } = useAdsMessageImagePersist()

  const create = useEntityFormMutation({
    mutate: async (values: AdsMessageFormValues): Promise<AdsMessagePublic> => {
      const { image, ...data } = values
      const message = await createMutation.mutateAsync({
        data: {
          title: data.title,
          description: data.description,
        },
        params: {} as CreateAdsMessageFacebookAdsMessagesPostParams,
      })

      try {
        return await persist(message, image)
      } catch (err) {
        notify.error(err, 'Anuncio creado, pero no se pudo guardar la foto')
        return message
      }
    },
    invalidateKeys: [getListAdsMessagesFacebookAdsMessagesGetQueryKey()],
    redirectTo: '/ads-messages',
    entityLabel: 'Anuncio',
    mode: 'create',
  })

  return (
    <EntityFormPage
      title="Nuevo anuncio"
      description="Crea un mensaje para publicar en Facebook."
      icon={Megaphone}
      Form={AdsMessageForm}
      defaultValues={adsMessageFormDefaultValues}
      formKey="create"
      onSubmit={create.run}
      isSubmitting={create.isPending}
      error={create.error}
      submitLabel="Crear"
      backTo="/ads-messages"
    />
  )
}
