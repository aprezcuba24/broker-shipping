import { OrganizationType } from '@broker/api'
import { OrganizationDirectoryPage } from '@broker/ui'

export function OrganizationsPage() {
  return <OrganizationDirectoryPage organizationType={OrganizationType.seller} />
}
