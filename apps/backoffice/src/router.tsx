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
import { ProductListPage } from './pages/product/list'

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

const productsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/products',
  component: ProductListPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  appLayoutRoute.addChildren([productsRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
