import { PageWrapper } from '@broker/ui'

export function HomePage() {
  return (
    <PageWrapper title="Dashboard" description="Administración global">
      <p className="text-muted-foreground">
        Sesión iniciada. Administración global lista para desarrollo.
      </p>
    </PageWrapper>
  )
}
