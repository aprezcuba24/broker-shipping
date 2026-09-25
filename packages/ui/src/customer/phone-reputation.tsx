import {
  formatApiError,
  useCreatePhoneBlacklistEntryPhoneBlacklistPost,
  useGetPhoneBlacklistStatusPhoneBlacklistStatusGet,
  useWithdrawPhoneBlacklistEntryPhoneBlacklistDelete,
  type CreatePhoneBlacklistEntryPhoneBlacklistPostParams,
  type GetPhoneBlacklistStatusPhoneBlacklistStatusGetParams,
  type PhoneBlacklistReason,
  type WithdrawPhoneBlacklistEntryPhoneBlacklistDeleteParams,
} from '@broker/api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  asBlacklistStatus,
  asPurchaseTier,
  PurchaseTier,
  type PurchaseTierValue,
} from './purchase-tier'

export type PhoneReputationProps = {
  phone: string
  tier: PurchaseTierValue | number
  className?: string
  /** When false, only shows status (no add/remove). Default true. */
  interactive?: boolean
}

export function PhoneReputation({
  phone,
  tier,
  className,
  interactive = true,
}: PhoneReputationProps) {
  const queryClient = useQueryClient()
  const enabled = Boolean(phone)

  const blacklistQuery = useGetPhoneBlacklistStatusPhoneBlacklistStatusGet(
    { phone } as GetPhoneBlacklistStatusPhoneBlacklistStatusGetParams,
    { query: { enabled } },
  )
  const addMutation = useCreatePhoneBlacklistEntryPhoneBlacklistPost()
  const removeMutation = useWithdrawPhoneBlacklistEntryPhoneBlacklistDelete()

  const blacklist = asBlacklistStatus(blacklistQuery.data?.status)
  const otherCount = blacklistQuery.data?.other_count ?? 0
  const busy =
    blacklistQuery.isFetching ||
    addMutation.isPending ||
    removeMutation.isPending

  async function invalidate() {
    await queryClient.invalidateQueries({
      queryKey: ['/phone-blacklist/status'],
    })
  }

  return (
    <PurchaseTier
      className={className}
      tier={asPurchaseTier(tier)}
      blacklist={blacklist}
      otherCount={otherCount}
      blacklistBusy={busy}
      onAddToBlacklist={
        interactive
          ? async ({ reason, note }) => {
              try {
                await addMutation.mutateAsync({
                  data: {
                    phone,
                    reason: reason as PhoneBlacklistReason,
                    note,
                  },
                  params: {} as CreatePhoneBlacklistEntryPhoneBlacklistPostParams,
                })
                await invalidate()
                toast.success('Teléfono agregado a la lista negra')
              } catch (error) {
                toast.error(formatApiError(error))
                throw error
              }
            }
          : undefined
      }
      onRemoveFromBlacklist={
        interactive
          ? async () => {
              try {
                await removeMutation.mutateAsync({
                  params: {
                    phone,
                  } as WithdrawPhoneBlacklistEntryPhoneBlacklistDeleteParams,
                })
                await invalidate()
                toast.success('Teléfono quitado de tu lista negra')
              } catch (error) {
                toast.error(formatApiError(error))
                throw error
              }
            }
          : undefined
      }
    />
  )
}
