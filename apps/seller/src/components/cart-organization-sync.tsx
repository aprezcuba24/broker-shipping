import { useActiveOrganization } from '@broker/ui'
import { useEffect, type ReactNode } from 'react'
import { useCartStore } from '@/stores/cart-store'

export function CartOrganizationSync({ children }: { children: ReactNode }) {
  const { activeOrganization } = useActiveOrganization()
  const setActiveOrganizationId = useCartStore((state) => state.setActiveOrganizationId)

  useEffect(() => {
    setActiveOrganizationId(activeOrganization?.id ?? null)
  }, [activeOrganization?.id, setActiveOrganizationId])

  return children
}
