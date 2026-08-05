import {
  useGetSellerDashboardDashboardSellerGet,
  type GetSellerDashboardDashboardSellerGetPeriod,
} from '@broker/api'
import {
  DASHBOARD_ITEM_STATUS_LABELS,
  DASHBOARD_ORDER_STATUS_LABELS,
  DashboardAlert,
  DashboardPeriodSelector,
  formatCurrencyAmounts,
  KpiCard,
  PageWrapper,
  RecentCommissionsCard,
  RecentOrdersCard,
  StatusBreakdownCard,
  useActiveOrganization,
  type DashboardPeriodValue,
} from '@broker/ui'
import {
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Package,
  Truck,
  Users,
} from 'lucide-react'
import { useState } from 'react'

export function HomePage() {
  const { activeOrganization } = useActiveOrganization()
  const [period, setPeriod] = useState<DashboardPeriodValue>('30d')

  const query = useGetSellerDashboardDashboardSellerGet(
    {
      period: period as GetSellerDashboardDashboardSellerGetPeriod,
      organization_id: activeOrganization?.id ?? '',
    },
    {
      query: {
        enabled: Boolean(activeOrganization?.id),
      },
    },
  )

  const data = query.data

  return (
    <PageWrapper
      title="Dashboard"
      description="Resumen operativo de tu organización vendedora."
      icon={LayoutDashboard}
      buttons={[
        <DashboardPeriodSelector key="period" value={period} onChange={setPeriod} />,
      ]}
    >
      {query.isLoading && !data ? (
        <p className="text-sm text-muted-foreground">Cargando resumen…</p>
      ) : query.isError ? (
        <p className="text-sm text-destructive">No se pudo cargar el dashboard.</p>
      ) : data ? (
        <div className="space-y-6">
          {(data.pending_link_requests > 0 ||
            data.orders_active > 0 ||
            data.linked_providers_total === 0) && (
            <div className="space-y-2">
              {data.linked_providers_total === 0 ? (
                <DashboardAlert to="/providers" tone="warning">
                  No tienes proveedores vinculados. Conéctate para empezar a vender.
                </DashboardAlert>
              ) : null}
              {data.pending_link_requests > 0 ? (
                <DashboardAlert to="/providers">
                  Tienes {data.pending_link_requests} solicitud
                  {data.pending_link_requests === 1 ? '' : 'es'} de vínculo pendiente
                  {data.pending_link_requests === 1 ? '' : 's'}.
                </DashboardAlert>
              ) : null}
              {data.orders_active > 0 ? (
                <DashboardAlert to="/orders?status=processing">
                  {data.orders_active} orden
                  {data.orders_active === 1 ? '' : 'es'} activa
                  {data.orders_active === 1 ? '' : 's'} en curso.
                </DashboardAlert>
              ) : null}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              label="Órdenes activas"
              value={data.orders_active}
              hint="Creadas + en proceso"
              icon={ClipboardList}
              to="/orders"
            />
            <KpiCard
              label="Ventas del período"
              value={formatCurrencyAmounts(data.sales_by_currency)}
              hint={activeOrganization?.name}
              icon={CircleDollarSign}
            />
            <KpiCard
              label="Comisiones pendientes"
              value={formatCurrencyAmounts(data.commissions_pending)}
              hint="Por cobrar"
              icon={CircleDollarSign}
              to="/commissions?is_paid=false"
            />
            <KpiCard
              label="Comisiones cobradas"
              value={formatCurrencyAmounts(data.commissions_paid)}
              hint="Pagadas en el período"
              icon={CircleDollarSign}
              to="/commissions?is_paid=true"
            />
            <KpiCard
              label="Clientes"
              value={data.customers_total}
              icon={Users}
            />
            <KpiCard
              label="Proveedores"
              value={data.linked_providers_total}
              hint={`${data.products_available_total} productos disponibles`}
              icon={Truck}
              to="/providers"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <StatusBreakdownCard
              title="Órdenes por estado"
              description="Distribución en el período seleccionado"
              rows={data.orders_by_status}
              labels={DASHBOARD_ORDER_STATUS_LABELS}
            />
            <StatusBreakdownCard
              title="Ítems por fulfillment"
              description="Estado de líneas en el período"
              rows={data.items_by_status}
              labels={DASHBOARD_ITEM_STATUS_LABELS}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RecentOrdersCard
              orders={data.recent_orders}
              orderPath={(id) => `/orders/${id}`}
              emptyHint="Aún no hay órdenes. Crea un pedido desde el carrito."
            />
            <RecentCommissionsCard
              commissions={data.recent_pending_commissions.map((row) => ({
                id: row.id,
                amount: row.amount,
                currency: row.currency,
                created_at: row.created_at,
                counterpartyLabel: 'Proveedor',
              }))}
              commissionPath={(id) => `/commissions/${id}`}
              emptyHint="No hay comisiones pendientes."
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Package className="size-3.5" />
            {data.products_available_total} productos en catálogo de proveedores
            vinculados.
          </div>
        </div>
      ) : null}
    </PageWrapper>
  )
}
