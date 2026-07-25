import { PageWrapper } from './page-wrapper'

export type PageLoadingProps = {
  title: string
}

export function PageLoading({ title }: PageLoadingProps) {
  return (
    <PageWrapper title={title}>
      <p className="text-sm text-muted-foreground">Cargando…</p>
    </PageWrapper>
  )
}
