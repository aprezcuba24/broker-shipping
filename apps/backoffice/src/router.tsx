import { useQuery } from '@tanstack/react-query'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { useAppStore } from './appStore'

function RootLayout() {
  const n = useAppStore((s) => s.n)
  const q = useQuery({
    queryKey: ['scaffold'],
    queryFn: () => Promise.resolve('ok'),
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <h1 className="text-2xl font-semibold">Portal proveedores</h1>
      <p className="text-slate-600">
        Broker B2B — carpeta{' '}
        <code className="rounded bg-slate-200 px-1">apps/backoffice</code>
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Zustand n={n} · react-query: {q.data ?? '…'}
      </p>
      <Outlet />
    </div>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <p className="mt-4 text-slate-700">Hola.</p>,
})

const routeTree = rootRoute.addChildren([indexRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
