import { AppLayout } from '@broker/ui'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import {
  adminBottomItems,
  adminBrand,
  adminNavItems,
  adminUser,
} from './config/navigation'
import { LoginPage } from './pages/login'
import { OrganizationListPage } from './pages/organization/list'

function RootLayout() {
  return <Outlet />
}

function AdminLayout() {
  const navigate = useNavigate()

  return (
    <AppLayout
      headerTitle="Administración global"
      navItems={adminNavItems}
      bottomItems={adminBottomItems}
      brand={adminBrand}
      user={adminUser}
      onLogout={() => void navigate({ to: '/login' })}
    />
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AdminLayout,
})

const organizationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/organizations',
  component: OrganizationListPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  appLayoutRoute.addChildren([
    organizationsRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
