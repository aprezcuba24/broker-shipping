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
import { PlaceholderPage } from './pages/placeholder-page'

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

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: () => (
    <PlaceholderPage
      title="Dashboard"
      description="Vista general de la administración global."
    />
  ),
})

const organizationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/organizations',
  component: () => (
    <PlaceholderPage
      title="Organizaciones"
      description="Gestión de organizaciones y tenants del ecosistema B2B."
    />
  ),
})

const usersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/users',
  component: () => (
    <PlaceholderPage
      title="Usuarios"
      description="Administración de usuarios y permisos globales."
    />
  ),
})

const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: () => (
    <PlaceholderPage
      title="Configuración"
      description="Ajustes de la plataforma de administración."
    />
  ),
})

const supportRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/support',
  component: () => (
    <PlaceholderPage
      title="Soporte"
      description="Ayuda y contacto interno."
    />
  ),
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    organizationsRoute,
    usersRoute,
    settingsRoute,
    supportRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
