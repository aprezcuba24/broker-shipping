import { AppLayout } from '@broker/ui'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import {
  backofficeBottomItems,
  backofficeBrand,
  backofficeNavItems,
  backofficeUser,
} from './config/navigation'
import { LoginPage } from './pages/login'
import { PlaceholderPage } from './pages/placeholder-page'

function RootLayout() {
  return <Outlet />
}

function BackofficeLayout() {
  const navigate = useNavigate()

  return (
    <AppLayout
      headerTitle="Portal proveedores"
      navItems={backofficeNavItems}
      bottomItems={backofficeBottomItems}
      brand={backofficeBrand}
      user={backofficeUser}
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
  component: BackofficeLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: () => (
    <PlaceholderPage
      title="Dashboard"
      description="Vista general del portal de proveedores."
    />
  ),
})

const catalogRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/catalog',
  component: () => (
    <PlaceholderPage
      title="Catálogo"
      description="Gestión de productos y categorías del proveedor."
    />
  ),
})

const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: () => (
    <PlaceholderPage
      title="Configuración"
      description="Preferencias y ajustes del portal."
    />
  ),
})

const supportRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/support',
  component: () => (
    <PlaceholderPage
      title="Soporte"
      description="Ayuda y contacto con el equipo Broker."
    />
  ),
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    catalogRoute,
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
