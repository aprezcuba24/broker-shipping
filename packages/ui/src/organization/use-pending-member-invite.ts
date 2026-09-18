import { usePreviewMemberInvitationOrganizationsInvitationsPreviewGet } from '@broker/api'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  peekInviteMeta,
  peekInviteToken,
  storeInviteMeta,
  storeInviteToken,
} from './invite-token-storage'

/**
 * Persist and resolve a member-invite token across auth tabs (verify-email opens a new tab).
 * Prefers URL `token`, then localStorage.
 */
export function usePendingMemberInvite() {
  const [searchParams] = useSearchParams()
  const fromUrl = searchParams.get('token')?.trim() || null
  const token = fromUrl ?? peekInviteToken()
  const cachedMeta = peekInviteMeta()

  useEffect(() => {
    if (fromUrl) {
      storeInviteToken(fromUrl)
    }
  }, [fromUrl])

  const previewQuery = usePreviewMemberInvitationOrganizationsInvitationsPreviewGet(
    { token: token ?? '' },
    {
      query: {
        enabled: Boolean(token),
        retry: false,
        staleTime: 60_000,
      },
    },
  )

  useEffect(() => {
    if (previewQuery.data) {
      storeInviteMeta({
        organizationName: previewQuery.data.organization_name,
        inviteeEmail: previewQuery.data.invitee_email,
      })
    }
  }, [previewQuery.data])

  const organizationName =
    previewQuery.data?.organization_name ?? cachedMeta?.organizationName ?? null
  const inviteeEmail =
    previewQuery.data?.invitee_email ?? cachedMeta?.inviteeEmail ?? null
  const userExists = previewQuery.data?.user_exists ?? null

  const paths = useMemo(() => {
    if (!token) {
      return {
        loginPath: '/login',
        registerPath: '/register',
        acceptPath: '/accept-invitation',
        verifiedLoginPath: '/login?verified=1',
      }
    }
    const q = `token=${encodeURIComponent(token)}`
    return {
      loginPath: `/login?${q}`,
      registerPath: `/register?${q}`,
      acceptPath: `/accept-invitation?${q}`,
      verifiedLoginPath: `/login?verified=1&${q}`,
    }
  }, [token])

  return {
    token,
    organizationName,
    inviteeEmail,
    userExists,
    isLoadingPreview: Boolean(token) && previewQuery.isPending,
    isPreviewError: previewQuery.isError,
    previewError: previewQuery.error,
    ...paths,
  }
}
