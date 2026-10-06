import type { PlatformProductCode } from '@broker/api'

import type { NavItem } from '../components/layout/types'

export function filterNavItemsByProduct(
  items: NavItem[],
  options: {
    hasProduct: (code: PlatformProductCode) => boolean
    isLoading: boolean
  },
): NavItem[] {
  const { hasProduct, isLoading } = options
  return items.filter((item) => {
    if (item.requiresProduct == null) {
      return true
    }
    if (isLoading) {
      return false
    }
    return hasProduct(item.requiresProduct)
  })
}
