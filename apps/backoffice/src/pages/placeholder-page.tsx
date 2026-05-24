import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@broker/ui'

type PlaceholderPageProps = {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Esta sección está preparada con la arquitectura base de diseño. La
          lógica de negocio se implementará en una fase posterior.
        </p>
      </CardContent>
    </Card>
  )
}
