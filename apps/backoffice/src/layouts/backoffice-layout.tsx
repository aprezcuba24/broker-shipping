import { AppLayout } from '@broker/ui'
import { useNavigate } from 'react-router-dom'
import {
  backofficeBottomItems,
  backofficeBrand,
  backofficeNavItems,
  backofficeUser,
} from '../config/navigation'

export function BackofficeLayout() {
  const navigate = useNavigate()

  return (
    <AppLayout
      headerTitle="Portal proveedores"
      navItems={backofficeNavItems}
      bottomItems={backofficeBottomItems}
      brand={backofficeBrand}
      user={backofficeUser}
      onLogout={() => navigate('/login')}
    />
  )
}
