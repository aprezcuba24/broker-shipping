import type { InvitationPublic, MemberPublic } from '@broker/api'
import { UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { DataTable } from '../components/data-table/data-table'
import { PageWrapper } from '../components/page-wrapper'
import { BtnConfirm } from '../components/btn-confirm'
import { BtnList } from '../components/btn-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import {
  actionsColumn,
  createdAtColumn,
  dateTimeColumn,
  EntityFormDialog,
  textColumn,
} from '../crud'
import type { ColumnDef } from '../components/data-table/types'
import { MemberInviteForm } from './member-invite-form'
import { useOrganizationMembers } from './use-organization-members'

export type OrganizationMembersPageProps = {
  description?: string
}

function buildMemberColumns(): ColumnDef<MemberPublic>[] {
  return [
    textColumn<MemberPublic>({ id: 'name', header: 'Nombre' }),
    textColumn<MemberPublic>({ id: 'email', header: 'Correo' }),
    dateTimeColumn<MemberPublic>({
      id: 'joined_at',
      accessor: 'joined_at',
      header: 'Fecha de ingreso',
      hideOn: 'md',
    }),
    {
      id: 'is_active',
      header: 'Estado',
      cell: (row) => (
        <Badge variant={row.is_active ? 'secondary' : 'outline'}>
          {row.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]
}

function buildInvitationColumns({
  onCancel,
  cancellingId,
}: {
  onCancel: (invitationId: string) => void | Promise<void>
  cancellingId: string | null
}): ColumnDef<InvitationPublic>[] {
  return [
    textColumn<InvitationPublic>({
      id: 'invitee_email',
      header: 'Correo',
      cell: (row) => row.invitee_email ?? '—',
    }),
    createdAtColumn<InvitationPublic>({ header: 'Enviada' }),
    actionsColumn((row) => (
      <BtnList>
        <BtnConfirm
          size="sm"
          variant="outline"
          title="Cancelar invitación"
          description={`¿Cancelar la invitación a ${row.invitee_email ?? 'este correo'}?`}
          confirmLabel="Cancelar invitación"
          confirmVariant="destructive"
          isLoading={cancellingId === row.id}
          onConfirm={() => onCancel(row.id)}
        >
          Cancelar
        </BtnConfirm>
      </BtnList>
    )),
  ]
}

export function OrganizationMembersPage({
  description = 'Miembros de tu organización e invitaciones pendientes.',
}: OrganizationMembersPageProps) {
  const {
    hasActiveOrg,
    members,
    membersLoading,
    invitations,
    invitationsLoading,
    cancellingId,
    inviteDialog,
    cancelInvitation,
  } = useOrganizationMembers()
  const [inviteOpen, setInviteOpen] = useState(false)

  const memberColumns = useMemo(() => buildMemberColumns(), [])
  const invitationColumns = useMemo(
    () =>
      buildInvitationColumns({
        onCancel: cancelInvitation,
        cancellingId,
      }),
    [cancelInvitation, cancellingId],
  )

  if (!hasActiveOrg) {
    return (
      <PageWrapper title="Miembros" description="Selecciona una organización." icon={Users}>
        <p className="text-sm text-muted-foreground">No hay organización activa.</p>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Miembros"
      description={description}
      icon={Users}
      buttons={[
        <Button
          key="invite"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => {
            inviteDialog.clearError()
            setInviteOpen(true)
          }}
        >
          <UserPlus className="h-4 w-4" />
          Invitar miembro
        </Button>,
      ]}
    >
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList variant="line">
          <TabsTrigger value="members">Miembros</TabsTrigger>
          <TabsTrigger value="pending">Invitaciones pendientes</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <DataTable
            columns={memberColumns}
            data={members}
            isLoading={membersLoading}
            getRowId={(row) => row.user_id}
            emptyMessage="No hay miembros registrados."
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <DataTable
            columns={invitationColumns}
            data={invitations}
            isLoading={invitationsLoading}
            getRowId={(row) => row.id}
            emptyMessage="No hay invitaciones pendientes."
          />
        </TabsContent>
      </Tabs>

      <EntityFormDialog
        title="Invitar miembro"
        acceptLabel="Enviar invitación"
        Form={(props) => <MemberInviteForm {...props} showSubmitButton={false} />}
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open)
          if (!open) inviteDialog.clearError()
        }}
        formKey="invite"
        defaultValues={{ invitee_email: '' }}
        onSubmit={inviteDialog.onSubmit}
        isSubmitting={inviteDialog.isSubmitting}
        error={inviteDialog.error}
      />
    </PageWrapper>
  )
}
