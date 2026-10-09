import { PlatformProductCode } from '@broker/api'
import { Ban, Facebook, Package, type LucideIcon } from 'lucide-react'
import {
  AuthPageShell,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  type AuthPortalBranding,
} from '@broker/ui'

export type OnboardingProductOption = {
  code: PlatformProductCode
  name: string
  description: string
  icon: LucideIcon
  required: boolean
  comingSoon: boolean
}

export const SELLER_ONBOARDING_PRODUCTS: OnboardingProductOption[] = [
  {
    code: PlatformProductCode.phone_blacklist,
    name: 'Lista negra',
    description: 'Consulta y reporte de teléfonos en lista negra.',
    icon: Ban,
    required: true,
    comingSoon: false,
  },
  {
    code: PlatformProductCode.facebook_publishing,
    name: 'Publicación en Facebook',
    description: 'Publicación de mensajes en grupos de Facebook.',
    icon: Facebook,
    required: true,
    comingSoon: false,
  },
  {
    code: PlatformProductCode.provider_management,
    name: 'Gestión de productos de proveedores',
    description: 'Catálogo, pedidos, comisiones y operación comercial.',
    icon: Package,
    required: false,
    comingSoon: true,
  },
]

export type OnboardingProductsStepProps = {
  portal: AuthPortalBranding
  isSubmitting?: boolean
  error?: string | null
  onBack: () => void
  onSubmit: (codes: PlatformProductCode[]) => void | Promise<void>
}

export function OnboardingProductsStep({
  portal,
  isSubmitting = false,
  error = null,
  onBack,
  onSubmit,
}: OnboardingProductsStepProps) {
  const selectedCodes = SELLER_ONBOARDING_PRODUCTS.filter((p) => p.required).map(
    (p) => p.code,
  )

  return (
    <AuthPageShell {...portal}>
      <Card className="w-full max-w-lg border-border shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-headline">Elige tus productos</CardTitle>
          <CardDescription>
            Selecciona a qué productos quieres tener acceso. Debes incluir al menos
            uno.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3" role="list">
            {SELLER_ONBOARDING_PRODUCTS.map((product) => {
              const Icon = product.icon
              const selected = product.required
              const disabled = product.comingSoon || product.required
              return (
                <li key={product.code}>
                  <div
                    className={cn(
                      'flex gap-3 rounded-lg border p-4 transition-colors',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card',
                      product.comingSoon && 'opacity-80',
                    )}
                    aria-disabled={disabled || undefined}
                  >
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-md',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium leading-none">{product.name}</p>
                        {product.comingSoon ? (
                          <Badge variant="secondary">Próximamente</Badge>
                        ) : null}
                        {product.required ? (
                          <Badge variant="outline">Incluido</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-start pt-1">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={selected}
                        disabled={disabled}
                        readOnly
                        aria-label={product.name}
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              type="button"
              className="w-full sm:flex-1"
              disabled={isSubmitting || selectedCodes.length === 0}
              onClick={() => void onSubmit(selectedCodes)}
            >
              {isSubmitting ? 'Creando…' : 'Finalizar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={onBack}
            >
              Atrás
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthPageShell>
  )
}
