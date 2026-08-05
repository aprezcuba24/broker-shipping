import {
  useGetProviderDashboardDashboardProviderGet,
  type GetProviderDashboardDashboardProviderGetParams,
  type GetProviderDashboardDashboardProviderGetPeriod,
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
  Link2,
  Package,
  Users,
} from 'lucide-react'
import { useState } from 'react'

export function HomePage() {
  const { activeOrganization } = useActiveOrganization()
  const [period, setPeriod] = useState<DashboardPeriodValue>('30d')

  const query = useGetProviderDashboardDashboardProviderGet({
    period: period as GetProviderDashboardDashboardProviderGetPeriod,
  } as GetProviderDashboardDashboardProviderGetParams)

  const data = query.data

  return (
    <PageWrapper
      title="Dashboard"
      description="Resumen operativo de tu organización proveedora."
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
            data.items_pending_action > 0 ||
            data.linked_sellers_total === 0) && (
            <div className="space-y-2">
              {data.linked_sellers_total === 0 ? (
                <DashboardAlert to="/settings/invitations" tone="warning">
                  No tienes vendedores vinculados. Revisa las solicitudes de enlace.
                </DashboardAlert>
              ) : null}
              {data.pending_link_requests > 0 ? (
                <DashboardAlert to="/settings/invitations">
                  Tienes {data.pending_link_requests} solicitud
                  {data.pending_link_requests === 1 ? '' : 'es'} de vínculo pendiente
                  {data.pending_link_requests === 1 ? '' : 's'}.
                </DashboardAlert>
              ) : null}
              {data.items_pending_action > 0 ? (
                <DashboardAlert to="/orders">
                  {data.items_pending_action} ítem
                  {data.items_pending_action === 1 ? '' : 's'} pendiente
                  {data.items_pending_action === 1 ? '' : 's'} de procesamiento.
                </DashboardAlert>
              ) : null}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              label="Órdenes activas"
              value={data.orders_active}
              hint="Con ítems tuyos abiertos"
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
              label="Comisiones por pagar"
              value={formatCurrencyAmounts(data.commissions_pending)}
              hint="Pendientes de pago"
              icon={CircleDollarSign}
              to="/commissions?is_paid=false"
            />
            <KpiCard
              label="Comisiones pagadas"
              value={formatCurrencyAmounts(data.commissions_paid)}
              hint="Pagadas en el período"
              icon={CircleDollarSign}
              to="/commissions?is_paid=true"
            />
            <KpiCard
              label="Ítems por atender"
              value={data.items_pending_action}
              hint="Creados, revisados o enviados"
              icon={ClipboardList}
              to="/orders"
            />
            <KpiCard
              label="Vendedores vinculados"
              value={data.linked_sellers_total}
              hint={`${data.products_total} productos en catálogo`}
              icon={Users}
              to="/settings/invitations"
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
              description="Estado de tus líneas en el período"
              rows={data.items_by_status}
              labels={DASHBOARD_ITEM_STATUS_LABELS}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RecentOrdersCard
              orders={data.recent_orders}
              orderPath={(id) => `/orders/${id}`}
              emptyHint="Aún no hay órdenes con tus productos."
            />
            <RecentCommissionsCard
              commissions={data.recent_pending_commissions.map((row) => ({
                id: row.id,
                amount: row.amount,
                currency: row.currency,
                created_at: row.created_at,
                counterpartyLabel: 'Vendedor',
              }))}
              commissionPath={(id) => `/commissions/${id}`}
              emptyHint="No hay comisiones pendientes de pago."
              title="Comisiones por pagar"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Package className="size-3.5" />
            {data.products_total} productos ·{' '}
            <Link2 className="size-3.5" />
            {data.pending_link_requests} solicitudes pendientes
          </div>
        </div>
      ) : null}
    </PageWrapper>
  )
}
