import type { PlatformProductCode } from '@broker/api'

import type { NavItem } from '../components/layout/types'

function itemAllowed(
  item: NavItem,
  options: {
    hasProduct: (code: PlatformProductCode) => boolean
    isLoading: boolean
  },
): boolean {
  if (item.requiresProduct == null) return true
  if (options.isLoading) return false
  return options.hasProduct(item.requiresProduct)
}

export function filterNavItemsByProduct(
  items: NavItem[],
  options: {
    hasProduct: (code: PlatformProductCode) => boolean
    isLoading: boolean
  },
): NavItem[] {
  return items.flatMap((item) => {
    if (!itemAllowed(item, options)) return []

    if (!item.children?.length) return [item]

    const children = filterNavItemsByProduct(item.children, options)
    if (children.length === 0) return []

    return [{ ...item, children }]
  })
}
